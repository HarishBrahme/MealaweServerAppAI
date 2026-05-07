
const { EC2Client, DescribeTagsCommand } = require('@aws-sdk/client-ec2');
const metadataUrl = 'http://169.254.169.254/latest/meta-data';
const tokenUrl = 'http://169.254.169.254/latest/api/token';
const timeout = 5000; // 5 second timeout

const getToken = async () => {
    return new Promise((resolve, reject) => {
      try{
        const options = {
          method: 'PUT',
          headers: {
            'X-aws-ec2-metadata-token-ttl-seconds': '21600'
          },
          timeout: timeout
        };
        console.log('#####1');

        const req = require('http').request(tokenUrl, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('#####2');
            if (res.statusCode === 200) {
              console.log('#####3');
              resolve(data);
            } else {
              console.log('#####4');
              reject(new Error(`Failed to get token: ${res.statusCode}`));
            }
          });
        });

        req.on('timeout', () => {
          console.log('#####5');
          req.destroy();
          reject(new Error('Token request timeout'));
        });

        req.on('error', reject);
        req.setTimeout(timeout);
        req.end();
      }catch(error){
        console.log('#####6');
        console.log('getToken error ',error);
        reject(error)
      }
    });
}

const makeMetadataRequest = async (path, token) =>{
    return new Promise((resolve, reject) => {
      console.log('#####9');
      try{
        const url = `${metadataUrl}${path}`;
        const options = {
          headers: token ? { 'X-aws-ec2-metadata-token': token } : {},
          timeout: timeout
        };
        console.log('#####10',path);
        const req = require('http').request(url, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('#####11');
            if (res.statusCode === 200) {
              console.log('#####12',data);
              resolve(data.trim());
            } else if (res.statusCode === 404) {
              console.log('#####13');
              resolve(null);
            } else {
              console.log('#####14');
              reject(new Error(`Metadata request failed: ${res.statusCode}`));
            }
          });
        });
        req.on('timeout', () => {
          console.log('#####16');
          req.destroy();
          reject(new Error('Metadata request timeout'));
        });
        req.on('error', reject);
        req.setTimeout(timeout);
        req.end();
      }catch(error){
        console.log('#####15');
        console.log('makeMetadataRequest error ',error);
        resolve(error);
      }
    });
  }

  /**
   * Get instance ID
   */
  const getInstanceId = async () => {
    const token = await getToken();
    return await makeMetadataRequest('/instance-id', token);
  }

  /**
   * Get instance tags using AWS SDK v3 (requires IAM permissions)
   */
  const getInstanceTags = async (instanceId, region) =>{
     console.log('#####19.1');
    const ec2Client = new EC2Client({ region });
    console.log('#####19');
    try {
      const command = new DescribeTagsCommand({
        Filters: [
          {
            Name: 'resource-id',
            Values: [instanceId]
          },
          {
            Name: 'resource-type',
            Values: ['instance']
          }
        ]
      });
      console.log('#####20');
      const result = await ec2Client.send(command);
        console.log('#####21');
      return result.Tags.reduce((tags, tag) => {
        tags[tag.Key] = tag.Value;
        return tags;
      }, {});
    } catch (error) {
      console.log('#####21.1');
      throw new Error(`Failed to get instance tags: ${error.message}`);
    }
  }

  /**
   * Get region from metadata
   */
  const getRegion = async () => {
    const token = await getToken();
    const az = await makeMetadataRequest('/placement/availability-zone', token);
    return az ? az.slice(0, -1) : null; // Remove last character (zone letter)
  }

  /**
   * Check if instance is part of an Auto Scaling Group
   */
  const isAutoScalingInstance = async () => {
    try {
      console.log('#####7');
      const instanceId = await getInstanceId();
      console.log('#####8 ',instanceId);
      const region = await getRegion();
      console.log('#####17 ',region);
      if (!instanceId || !region) {
        throw new Error('Could not retrieve instance ID or region');
      }
      console.log('#####18 ',instanceId, region);
      const tags = await getInstanceTags(instanceId, region);
      console.log('#####22 ',tags);
      // Check for Auto Scaling Group indicators
      const asgIndicators = [
        'aws:autoscaling:groupName',
        'aws:autoscaling:groupName',
        'AutoScalingGroupName'
      ];
console.log('#####22.1');
      for (const indicator of asgIndicators) {
        if (tags[indicator]) {
          return {
            isAutoScaling: true,
            autoScalingGroupName: tags[indicator],
            allTags: tags
          };
        }
      }
console.log('#####23');
      // Additional check: look for ASG-related tag patterns
      const asgRelatedTags = Object.keys(tags).filter(key => 
        key.toLowerCase().includes('autoscaling') || 
        key.toLowerCase().includes('asg')
      );
console.log('#####24');
      return {
        isAutoScaling: false,
        autoScalingGroupName: null,
        asgRelatedTags,
        allTags: tags
      };

    } catch (error) {
      //throw new Error(`Auto Scaling detection failed: ${error.message}`);
         return {
        isAutoScaling: false
      };
    }
  }

  /**
   * Get comprehensive instance metadata
   */
  const getInstanceMetadata = async () => {
    try {
      const token = await getToken();
      const instanceId = await getInstanceId();
      const region = await getRegion();

      const metadata = {
        instanceId,
        region,
        availabilityZone: await makeMetadataRequest('/placement/availability-zone', token),
        instanceType: await makeMetadataRequest('/instance-type', token),
        publicIpv4: await makeMetadataRequest('/public-ipv4', token),
        privateIpv4: await makeMetadataRequest('/local-ipv4', token),
        securityGroups: await makeMetadataRequest('/security-groups', token),
        iamRole: await makeMetadataRequest('/iam/security-credentials/', token)
      };

      // Get tags if possible
      try {
        metadata.tags = await getInstanceTags(instanceId, region);
      } catch (error) {
        console.warn('Could not retrieve tags:', error.message);
        metadata.tags = {};
      }

      return metadata;
    } catch (error) {
      throw new Error(`Failed to get instance metadata: ${error.message}`);
    }
  }

module.exports = {
    isAutoScalingInstance    
};
