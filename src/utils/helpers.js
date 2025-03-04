// import calculateDiscount from './discount';

export function removePortalLinkFromUrl() {
    const [path] = window.location.hash.substr(1).split('?');
    const linkRegex = /^\/portal\/?(?:\/(\w+(?:\/\w+)*))?\/?$/;
    if (path && linkRegex.test(path)) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
}

export function getPortalLinkPath({page}) {
    const Links = {
        signin: '#/portal/signin',
        signup: '#/portal/signup'
    };
    if (Object.keys(Links).includes(page)) {
        return Links[page];
    }
    return Links.default;
}

export function getPortalLink({page, siteUrl}) {
    const url = siteUrl || `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    const portalLinkPath = getPortalLinkPath({page});
    return `${url}${portalLinkPath}`;
}

export function isCookiesDisabled() {
    return !(navigator && navigator.cookieEnabled);
}

export function isSentryEventAllowed({event: sentryEvent}) {
    const frames = sentryEvent?.exception?.values?.[0]?.stacktrace?.frames || [];
    const fileNames = frames.map(frame => frame.filename).filter(filename => !!filename);
    const lastFileName = fileNames[fileNames.length - 1] || '';
    return lastFileName.includes('@tryghost/portal');
}

export function getMemberSubscription({member = {}}) {
    if (isPaidMember({member})) {
        const subscriptions = member.subscriptions || [];
        const activeSubscription = subscriptions.find((sub) => {
            return ['active', 'trialing', 'unpaid', 'past_due'].includes(sub.status);
        });
        if (!activeSubscription?.price && activeSubscription?.plan) {
            activeSubscription.price = activeSubscription.plan;
        }
        return activeSubscription;
    }
    return null;
}

export function isComplimentaryMember({member = {}}) {
    if (!member) {
        return false;
    }
    const subscription = getMemberSubscription({member});
    if (subscription) {
        const {price} = subscription;
        return (price && price.amount === 0);
    } else if (!subscription && !!member.paid) {
        return true;
    }
    return false;
}

export function isPaidMember({member = {}}) {
    return (member && member.paid);
}

export function getProductCurrency({product}) {
    if (!product?.monthlyPrice) {
        return null;
    }
    return product.monthlyPrice.currency;
}

export function getUpgradeProducts({site, member}) {
    const activePrice = getMemberActivePrice({member});
    const activePriceCurrency = activePrice?.currency;
    const availableProducts = getAvailableProducts({site});
    if (!activePrice) {
        return availableProducts;
    }
    return availableProducts.filter((product) => {
        return (getProductCurrency({product}) === activePriceCurrency);
    });
}

export function getFilteredPrices({prices, currency}) {
    return prices.filter((d) => {
        return (d.currency || '').toLowerCase() === (currency || '').toLowerCase();
    });
}

export function getPriceFromSubscription({subscription}) {
    if (subscription && subscription.price) {
        return {
            ...subscription.price,
            stripe_price_id: subscription.price.id,
            id: subscription.price.price_id,
            price: subscription.price.amount / 100,
            name: subscription.price.nickname,
            currency: subscription.price.currency.toLowerCase(),
            currency_symbol: getCurrencySymbol(subscription.price.currency)
        };
    }
    return null;
}

export function getMemberActivePrice({member}) {
    const subscription = getMemberSubscription({member});
    return getPriceFromSubscription({subscription});
}

export function getSubscriptionFromId({member, subscriptionId}) {
    if (isPaidMember({member})) {
        const subscriptions = member.subscriptions || [];
        return subscriptions.find(d => d.id === subscriptionId);
    }
    return null;
}

export function hasOnlyFreePlan({plans, site = {}}) {
    plans = plans || getSitePrices({site});
    return !plans || plans.length === 0 || (plans.length === 1 && plans[0].type === 'free');
}

export function hasPrice({site = {}, plan}) {
    const prices = getSitePrices({site});
    if (plan === 'free') {
        return !prices || prices.length === 0 || prices.find(p => p.type === 'free');
    } else if (plan === 'monthly') {
        return prices && prices.length > 0 && prices.find(p => p.name === 'Monthly');
    } else if (plan === 'yearly') {
        return prices && prices.length > 0 && prices.find(p => p.name === 'Yearly');
    } else if (plan) {
        return prices && prices.length > 0 && prices.find(p => p.id === plan);
    }
    return false;
}

export function getQueryPrice({site = {}, priceId}) {
    const prices = getAvailablePrices({site});
    if (priceId === 'free') {
        return !prices || prices.length === 0 || prices.find(p => p.type === 'free');
    } else if (prices && prices.length > 0 && priceId === 'monthly') {
        const monthlyByName = prices.find(p => p.name === 'Monthly');
        const monthlyByInterval = prices.find(p => p.interval === 'month');
        return monthlyByName || monthlyByInterval;
    } else if (prices && prices.length > 0 && priceId === 'yearly') {
        const yearlyByName = prices.find(p => p.name === 'Yearly');
        const yearlyByInterval = prices.find(p => p.interval === 'year');
        return yearlyByName || yearlyByInterval;
    } else if (prices && prices.length > 0 && priceId) {
        return prices.find(p => p.id === priceId);
    }
    return null;
}

export function capitalize(str) {
    if (typeof str !== 'string' || !str) {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isInviteOnlySite({site = {}, pageQuery = ''}) {
    const prices = getSitePrices({site, pageQuery});
    return prices.length === 0 || (site && site.members_signup_access === 'invite');
}

export function hasMultipleProducts({site}) {
    const products = getAvailableProducts({site});

    if (products?.length > 1) {
        return true;
    }
    return false;
}

export function hasMultipleProductsFeature({site}) {
    const {portal_products: portalProducts} = site || {};
    return !!portalProducts;
}

export function getAvailableProducts({site}) {
    const {portal_products: portalProducts, products = [], portal_plans: portalPlans = []} = site || {};

    if (!portalPlans.includes('monthly') && !portalPlans.includes('yearly')) {
        return [];
    }

    return products.filter(product => !!product).filter((product) => {
        return !!(product.monthlyPrice && product.yearlyPrice);
    }).filter((product) => {
        return !!(Object.keys(product.monthlyPrice).length > 0 && Object.keys(product.yearlyPrice).length > 0);
    }).filter((product) => {
        if (portalProducts && products.length > 1) {
            return portalProducts.includes(product.id);
        }
        return true;
    }).sort((productA, productB) => {
        return productA?.monthlyPrice?.amount - productB?.monthlyPrice?.amount;
    }).map((product) => {
        product.monthlyPrice = {
            ...product.monthlyPrice,
            currency_symbol: getCurrencySymbol(product.monthlyPrice.currency)
        };
        product.yearlyPrice = {
            ...product.yearlyPrice,
            currency_symbol: getCurrencySymbol(product.yearlyPrice.currency)
        };
        return product;
    });
}

export function getAllProductsForSite({site}) {
    const {products = [], portal_plans: portalPlans = []} = site || {};

    if (!portalPlans.includes('monthly') && !portalPlans.includes('yearly')) {
        return [];
    }

    return products.filter(product => !!product).filter((product) => {
        return !!(product.monthlyPrice && product.yearlyPrice);
    }).filter((product) => {
        return !!(Object.keys(product.monthlyPrice).length > 0 && Object.keys(product.yearlyPrice).length > 0);
    }).sort((productA, productB) => {
        return productA?.monthlyPrice?.amount - productB?.monthlyPrice?.amount;
    }).map((product) => {
        product.monthlyPrice = {
            ...product.monthlyPrice,
            currency_symbol: getCurrencySymbol(product.monthlyPrice.currency)
        };
        product.yearlyPrice = {
            ...product.yearlyPrice,
            currency_symbol: getCurrencySymbol(product.yearlyPrice.currency)
        };
        return product;
    });
}

export function hasBenefits({prices, site}) {
    if (!hasMultipleProductsFeature({site})) {
        return false;
    }
    if (!prices?.length) {
        return false;
    }
    return prices.some((price) => {
        return price?.benefits?.length;
    });
}

export function getSiteProducts({site}) {
    const products = getAvailableProducts({site});
    if (hasFreeProductPrice({site}) && products.length > 0) {
        products.unshift({
            id: 'free'
        });
    }
    return products;
}

export function getFreeBenefits() {
    return [{
        name: 'Access to free articles'
    }];
}

export function getProductBenefits({product, site = null}) {
    if (product?.monthlyPrice && product?.yearlyPrice) {
        const productBenefits = product?.benefits || [];
        const monthlyBenefits = productBenefits;
        const yearlyBenefits = productBenefits;
        // const availablePrices = getAvailablePrices({site, products: [product]});
        // const yearlyDiscount = calculateDiscount(product.monthlyPrice.amount, product.yearlyPrice.amount);
        // if (yearlyDiscount > 0 && availablePrices.length > 1) {
        //     yearlyBenefits.push({
        //         name: `${yearlyDiscount}% annual discount`,
        //         className: `gh-portal-strong`
        //     });
        // }
        return {
            monthly: monthlyBenefits,
            yearly: yearlyBenefits
        };
    }
}

export function getProductFromId({site, productId}) {
    const availableProducts = getAllProductsForSite({site});
    return availableProducts.find(product => product.id === productId);
}

export function getPricesFromProducts({site = null, products = null}) {
    if (!site && !products) {
        return [];
    }

    const availableProducts = products || getAvailableProducts({site});
    const prices = availableProducts.reduce((accumPrices, product) => {
        if (product.monthlyPrice && product.yearlyPrice) {
            accumPrices.push(product.monthlyPrice);
            accumPrices.push(product.yearlyPrice);
        }
        return accumPrices;
    }, []);
    return prices;
}

export function hasFreeProductPrice({site}) {
    const {
        allow_self_signup: allowSelfSignup,
        portal_plans: portalPlans
    } = site || {};
    return allowSelfSignup && portalPlans.includes('free');
}

export function getProductFromPrice({site, priceId}) {
    const products = getAllProductsForSite({site});
    return products.find((product) => {
        return (product?.monthlyPrice?.id === priceId) || (product?.yearlyPrice?.id === priceId);
    });
}

export function getAvailablePrices({site, products = null}) {
    const {
        portal_plans: portalPlans = [],
        is_stripe_configured: isStripeConfigured
    } = site || {};

    if (!isStripeConfigured) {
        return [];
    }

    const productPrices = getPricesFromProducts({site, products});

    return productPrices.filter((d) => {
        return !!(d && d.id);
    }).map((d) => {
        return {
            ...d,
            price_id: d.id,
            price: d.amount / 100,
            name: d.nickname,
            currency_symbol: getCurrencySymbol(d.currency)
        };
    }).filter((price) => {
        return price.amount !== 0 && price.type === 'recurring';
    }).filter((price) => {
        if (price.interval === 'month') {
            return portalPlans.includes('monthly');
        }
        if (price.interval === 'year') {
            return portalPlans.includes('yearly');
        }
        return false;
    }).sort((a, b) => {
        return a.amount - b.amount;
    }).sort((a, b) => {
        if (!a.currency || !b.currency) {
            return 0;
        }
        return a.currency.localeCompare(b.currency, undefined, {ignorePunctuation: true});
    });
}

export function getFreePriceCurrency({site}) {
    const stripePrices = getAvailablePrices({site});

    let freePriceCurrencyDetail = {
        currency: 'usd',
        currency_symbol: '$'
    };
    if (stripePrices?.length > 0) {
        freePriceCurrencyDetail.currency = stripePrices[0].currency;
        freePriceCurrencyDetail.currency_symbol = stripePrices[0].currency_symbol;
    }
    return freePriceCurrencyDetail;
}

export function getSitePrices({site = {}, pageQuery = ''} = {}) {
    const {
        allow_self_signup: allowSelfSignup,
        portal_plans: portalPlans
    } = site || {};

    const plansData = [];

    if (allowSelfSignup && portalPlans.includes('free')) {
        const freePriceCurrencyDetail = getFreePriceCurrency({site});
        plansData.push({
            id: 'free',
            type: 'free',
            price: 0,
            amount: 0,
            name: 'Free',
            ...freePriceCurrencyDetail

        });
    }
    const showOnlyFree = pageQuery === 'free' && hasFreeProductPrice({site});

    if (!showOnlyFree) {
        const stripePrices = getAvailablePrices({site});
        stripePrices.forEach((price) => {
            plansData.push(price);
        });
    }
    return plansData;
}

export const getMemberEmail = ({member}) => {
    if (!member) {
        return '';
    }
    return member.email;
};

export const getFirstpromoterId = ({site}) => {
    return (site && site.firstpromoter_id);
};

export const getMemberName = ({member}) => {
    if (!member) {
        return '';
    }
    return member.name;
};

export const getSupportAddress = ({site}) => {
    const {members_support_address: supportAddress} = site || {};
    return supportAddress || '';
};

export const getSiteDomain = ({site}) => {
    try {
        return ((new URL(site.url)).origin).replace(/^http(s?):\/\//, '').replace(/\/$/, '');
    } catch (e) {
        return site.url.replace(/^http(s?):\/\//, '').replace(/\/$/, '');
    }
};

export const getCurrencySymbol = (currency) => {
    return Intl.NumberFormat('es', {currency, style: 'currency'}).format(0).replace(/[\d\s.]/g, ''); //Fuzen - usar 'es' y no 'en'
};

export const getStripeAmount = (amount) => {
    if (isNaN(amount)) {
        return 0;
    }
    return (amount / 100);
};

export const getPriceString = (price = {}) => {
    const symbol = getCurrencySymbol(price.currency);
    const amount = getStripeAmount(price.amount);
    return `${symbol}${amount}/${price.interval}`;
};

export const formatNumber = (amount) => {
    if (amount === undefined || amount === null) {
        return '';
    }
    return amount.toLocaleString();
};

export const createPopupNotification = ({type, status, autoHide, duration, closeable, state, message, meta = {}}) => {
    let count = 0;
    if (state && state.popupNotification) {
        count = (state.popupNotification.count || 0) + 1;
    }
    return {
        type,
        status,
        autoHide,
        closeable,
        duration,
        meta,
        message,
        count
    };
};

export function isSameCurrency(currency1, currency2) {
    return currency1?.toLowerCase() === currency2?.toLowerCase();
}

export function getPriceIdFromPageQuery({site, pageQuery}) {
    const productMonthlyPriceQueryRegex = /^(?:(\S+?))?\/monthly$/;
    const productYearlyPriceQueryRegex = /^(?:(\S+?))?\/yearly$/;
    if (productMonthlyPriceQueryRegex.test(pageQuery || '')) {
        const [, productId] = pageQuery.match(productMonthlyPriceQueryRegex);
        const product = getProductFromId({site, productId});
        return product?.monthlyPrice?.id;
    } else if (productYearlyPriceQueryRegex.test(pageQuery || '')) {
        const [, productId] = pageQuery.match(productYearlyPriceQueryRegex);
        const product = getProductFromId({site, productId});
        return product?.yearlyPrice?.id;
    }
    return null;
}
