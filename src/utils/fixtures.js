export const sites = {
    singleProduct: getSiteData({
        products: getProductsData({numOfProducts: 1})
    })
};

function objectId() {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function () {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
}

export function getSiteData({
    products = getProductsData({numOfProducts: 1}),
    portalProducts = products.map(p => p.id),
    portalPlans: portal_plans = ['free', 'monthly', 'yearly']
} = {}) {
    return {
        title: 'The Blueprint',
        description: 'Thoughts, stories and ideas.',
        logo: 'https://static.ghost.org/v4.0.0/images/ghost-orb-1.png',
        icon: 'https://static.ghost.org/v4.0.0/images/ghost-orb-1.png',
        accent_color: '#45C32E',
        url: 'https://portal.localhost',
        plans: {
            monthly: 5000,
            yearly: 150000,
            currency: 'USD'
        },
        products,
        portal_products: portalProducts,
        allow_self_signup: true,
        members_signup_access: 'all',
        free_price_name: 'Free',
        free_price_description: 'Free preview',
        is_stripe_configured: true,
        portal_button: true,
        portal_name: true,
        portal_plans,
        portal_button_icon: 'icon-1',
        portal_button_signup_text: 'Subscribe now',
        portal_button_style: 'icon-and-text',
        members_support_address: 'support@example.com'
    };
}

function getOfferData({
    name = 'Black Friday',
    code = 'black-friday',
    displayTitle = 'Black Friday',
    displayDescription = 'Special deal',
    type = 'percent',
    cadence = 'month',
    amount = 50,
    duration = 'once',
    durationInMonths = null,
    currencyRestriction = false,
    currency = null,
    status = 'active',
    tierId = ''
} = {}) {
    return {
        id: `offer_${objectId()}`,
        name,
        code,
        display_title: displayTitle,
        display_description: displayDescription,
        type,
        cadence,
        amount,
        duration,
        duration_in_months: durationInMonths,
        currency_restriction: currencyRestriction,
        currency,
        status,
        tier: {
            id: `${tierId}`,
            name: 'Basic'
        }
    };
}

function getMemberData({
    name = 'Jamie Larson',
    email = 'jamie@example.com',
    firstname = 'Jamie',
    subscriptions = [],
    paid = false,
    avatarImage: avatar_image = '',
    subscribed = true
} = {}) {
    return {
        uuid: `member_${objectId()}`,
        email,
        name,
        firstname,
        paid,
        subscribed,
        avatar_image,
        subscriptions
    };
}

export function getProductsData({numOfProducts = 3} = {}) {
    const products = [
        getProductData({
            name: 'Bronze',
            description: 'Access to all members articles',
            monthlyPrice: getPriceData({
                interval: 'month',
                amount: 700
            }),
            yearlyPrice: getPriceData({
                interval: 'year',
                amount: 7000
            }),
            numOfBenefits: 2
        }),
        getProductData({
            name: 'Silver',
            description: 'Access to all members articles and weekly podcast',
            monthlyPrice: getPriceData({
                interval: 'month',
                amount: 1200
            }),
            yearlyPrice: getPriceData({
                interval: 'year',
                amount: 12000
            }),
            numOfBenefits: 3
        }),
        getProductData({
            name: 'Friends of the browser',
            description: 'Get access to everything and lock in early adopter pricing for life + listen to my podcast',
            monthlyPrice: getPriceData({
                interval: 'month',
                amount: 18000
            }),
            yearlyPrice: getPriceData({
                interval: 'year',
                amount: 17000
            }),
            numOfBenefits: 4
        })
    ];
    return products.slice(0, numOfProducts);
}

function getProductData({
    name = 'Basic',
    description = '',
    id = `product_${objectId()}`,
    monthlyPrice = getPriceData(),
    yearlyPrice = getPriceData({interval: 'year'}),
    numOfBenefits = 2
}) {
    return {
        id: id,
        name: name,
        description,
        monthlyPrice,
        yearlyPrice,
        benefits: getBenefits({numOfBenefits})

    };
}

function getBenefits({numOfBenefits}) {
    const beenfits = [
        getBenefitData({name: 'Limited early adopter pricing'}),
        getBenefitData({name: 'Latest gear reviews'}),
        getBenefitData({name: 'Weekly email newsletter'}),
        getBenefitData({name: 'Listen to my podcast'})
    ];
    return beenfits.slice(0, numOfBenefits);
}

function getBenefitData({
    id = `benefit_${objectId()}`,
    name = 'Benefit'
}) {
    return {
        id,
        name
    };
}

function getPriceData({
    interval = 'month',
    amount = (interval === 'month' ? 500 : 5000),
    nickname = interval === 'month' ? 'Monthly' : 'Yearly',
    description = null,
    currency = 'usd',
    active = true,
    id = `price_${objectId()}`
}) {
    return {
        id: id,
        active,
        nickname,
        currency,
        amount,
        interval,
        description,
        stripe_price_id: `price_${objectId()}`,
        stripe_product_id: `prod_${objectId()}`,
        type: 'recurring'
    };
}

function getSubscriptionData({
    id = `sub_${objectId()}`,
    status = 'active',
    currency = 'USD',
    interval = 'month',
    amount = (interval === 'month' ? 500 : 5000),
    nickname = (interval === 'month' ? 'Monthly' : 'Yearly'),
    cardLast4 = '4242',
    priceId: price_id = `price_${objectId()}`,
    startDate: start_date = '2021-10-05T03:18:30.000Z',
    currentPeriodEnd: current_period_end = '2022-10-05T03:18:30.000Z',
    cancelAtPeriodEnd: cancel_at_period_end = false
} = {}) {
    return {
        id,
        customer: {
            id: `cus_${objectId()}`,
            name: 'Jamie',
            email: 'jamie@example.com'
        },
        plan: {
            id: `price_${objectId()}`,
            nickname,
            amount,
            interval,
            currency
        },
        status,
        start_date,
        default_payment_card_last4: cardLast4,
        cancel_at_period_end,
        cancellation_reason: null,
        current_period_end,
        price: {
            id: `stripe_price_${objectId()}`,
            price_id,
            nickname,
            amount,
            interval,
            type: 'recurring',
            currency,
            product: {
                id: `stripe_prod_${objectId()}`,
                product_id: `prod_${objectId()}`
            }
        }
    };
}

function getTestSite() {
    const products = getProductsData({numOfProducts: 1});
    const portalProducts = products.map(p => p.id);
    const portalPlans = ['free', 'monthly', 'yearly'];
    return getSiteData({
        products,
        portalPlans,
        portalProducts
    });
}

export const testSite = getTestSite();

export const site = getSiteData({
    products: getProductsData({numOfProducts: 3})
});

export const offer = getOfferData({
    tierId: site.products[0].id
});

export const member = {
    free: getMemberData(),
    paid: getMemberData({
        paid: true,
        subscriptions: [
            getSubscriptionData()
        ]
    }),
    complimentary: getMemberData({
        paid: true,
        subscriptions: []
    }),
    complimentaryWithSubscription: getMemberData({
        paid: true,
        subscriptions: [
            getSubscriptionData({
                amount: 0
            })
        ]
    }),
    preview: getMemberData({
        paid: true,
        subscriptions: [
            getSubscriptionData({
                amount: 1500,
                startDate: '2019-05-01T11:42:40.000Z',
                currentPeriodEnd: '2021-06-05T11:42:40.000Z'
            })
        ]
    })
};
export function generateAccountPlanFixture() {
    const products = getProductsData({numOfProducts: 3});
    return {
        site: getSiteData({
            portalProducts: [products[1]]
        }),
        member: member.paid
    };
}

export function basic() {
    const products = getProductsData();
    const siteData = getSiteData({
        products
    });
    const defaultMemberPrice = products?.[0].monthlyPrice;
    const memberData = getMemberData({
        paid: true,
        subscriptions: [
            getSubscriptionData({
                priceId: defaultMemberPrice.id,
                amount: defaultMemberPrice.amount,
                currency: defaultMemberPrice.currency
            })
        ]
    });
    return {
        site: siteData,
        member: memberData
    };
}
