const welcomeTemplate = (to, videoLink) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "welcome__mealawe_clone",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "video",
                        video: { link: videoLink }
                    }
                ]
            }
        ]
    }
});

const welcomeKotaTemplate = (to, videoLink) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "kota_welcome_video_final",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "video",
                        video: { link: videoLink }
                    }
                ]
            }
        ]
    }
});

// 2. Carousel Message (5 images)
const secondMessageCarousel = (to, linksArray = []) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "second_massage_",
        components: [
            {
                type: "carousel",
                cards: linksArray.map((link, index) => ({
                    card_index: index,
                    components: [
                        {
                            type: "header",
                            parameters: [
                                {
                                    type: "image",
                                    image: { link }
                                }
                            ]
                        }
                    ]
                }))
            }
        ]
    }
});

// 3. Final Offer
const finalOfferTemplate = (to) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "final_offer_coupan_code_pune_banglore_mumbai",
        components: []
    }
});

// 4. First-Time Customer Thank You
const firstTimeCustomerFeedback = (to, imageLink, textValue) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "first_time_customer__thank_you__feedbac",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            },
            {
                type: "body",
                parameters: [
                    {
                        type: "text",
                        text: textValue
                    }
                ]
            }
        ]
    }
});

// 5. Low Rating Customer
const lowRatingCustomerTemplate = (to, imageLink, textValue) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "low_rating_customers",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            },
            {
                type: "body",
                parameters: [
                    {
                        type: "text",
                        text: textValue
                    }
                ]
            }
        ]
    }
});
// 6. Renewal 3 Days Reminder (image only)
const renewal3DaysReminder = (to, imageLink) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "renewal_3_days_reminder_",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            }
        ]
    }
});

// 7. Renewal 2 Days Reminder (image + text)
const renewal2DaysReminder = (to, imageLink, textValue) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "renewal_2_days_reminder__clone",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            },
            {
                type: "body",
                parameters: [
                    {
                        type: "text",
                        text: textValue
                    }
                ]
            }
        ]
    }
});

// 8. Renewal 1 Day Reminder (image + text)
const renewal1DayReminder = (to, imageLink, textValue) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "renewal_1_days_reminder__clone_clone",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            },
            {
                type: "body",
                parameters: [
                    {
                        type: "text",
                        text: textValue
                    }
                ]
            }
        ]
    }
});

// 9. Renew Today (image + text)
const renewTodayTemplate = (to, imageLink, textValue) => ({
    to,
    recipient_type: "individual",
    type: "template",
    template: {
        language: { policy: "deterministic", code: "en" },
        name: "renew_today_",
        components: [
            {
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: imageLink }
                    }
                ]
            },
            {
                type: "body",
                parameters: [
                    {
                        type: "text",
                        text: textValue
                    }
                ]
            }
        ]
    }
});

// 📤 Export all
module.exports = {
    welcomeTemplate,
    welcomeKotaTemplate,
    secondMessageCarousel,
    finalOfferTemplate,
    firstTimeCustomerFeedback,
    lowRatingCustomerTemplate,
    renewal3DaysReminder,
    renewal2DaysReminder,
    renewal1DayReminder,
    renewTodayTemplate
};
