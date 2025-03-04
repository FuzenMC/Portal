import Frame from './Frame';
import {hasMode} from '../utils/check-mode';
import AppContext from '../AppContext';
import {getFrameStyles} from './Frame.styles';
import Pages, {getActivePage} from '../pages';
import PopupNotification from './common/PopupNotification';
import {hasMultipleProducts, isCookiesDisabled, getSitePrices, isInviteOnlySite} from '../utils/helpers';

const React = require('react');

const StylesWrapper = ({member}) => {
    return {
        modalContainer: {
            zIndex: '3999999',
            position: 'fixed',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        },
        frame: {
            common: {
                margin: 'auto',
                position: 'relative',
                padding: '0',
                outline: '0',
                width: '100%',
                opacity: '1',
                overflow: 'hidden',
                height: '100%'
            }
        },
        page: {
            links: {
                width: '600px'
            }
        }
    };
};

function CookieDisabledBanner({message}) {
    const cookieDisabled = isCookiesDisabled();
    if (cookieDisabled) {
        return (
            <div className='gh-portal-cookiebanner'>{message}</div>
        );
    }
    return null;
}

class PopupContent extends React.Component {
    static contextType = AppContext;

    componentDidMount() {
        // Handle Esc to close popup
        if (this.node && !hasMode(['preview'])) {
            this.node.focus();
            this.keyUphandler = (event) => {
                const eventTargetTag = (event.target && event.target.tagName);
                if (event.key === 'Escape' && eventTargetTag !== 'INPUT') {
                    this.context.onAction('closePopup');
                }
            };
            this.node.ownerDocument.removeEventListener('keyup', this.keyUphandler);
            this.node.ownerDocument.addEventListener('keyup', this.keyUphandler);
        }
        this.sendContainerHeightChangeEvent();
    }

    sendContainerHeightChangeEvent() {
        if (this.node && hasMode(['preview'])) {
            if (this.node?.clientHeight !== this.lastContainerHeight) {
                this.lastContainerHeight = this.node?.clientHeight;
                window.document.body.style.overflow = 'hidden';
                window.document.body.style['scrollbar-width'] = 'none';
                window.parent.postMessage({
                    type: 'portal-preview-updated',
                    payload: {
                        height: this.lastContainerHeight
                    }
                }, '*');
            }
        }
    }

    componentDidUpdate() {
        this.sendContainerHeightChangeEvent();
    }

    componentWillUnmount() {
        if (this.node) {
            this.node.ownerDocument.removeEventListener('keyup', this.keyUphandler);
        }
    }

    handlePopupClose(e) {
        if (hasMode(['preview'])) {
            return;
        }
        e.preventDefault();
        if (e.target === e.currentTarget) {
            this.context.onAction('closePopup');
        }
    }

    renderActivePage() {
        const {page} = this.context;
        getActivePage({page});
        const PageComponent = Pages[page];

        return (
            <PageComponent />
        );
    }

    renderPopupNotification() {
        const {popupNotification} = this.context;
        if (!popupNotification || !popupNotification.type) {
            return null;
        }
        return (
            <PopupNotification />
        );
    }

    render() {
        const {page, site, pageQuery, customSiteUrl} = this.context;
        const {is_stripe_configured: isStripeConfigured} = site;

        getActivePage({page});
        const Styles = StylesWrapper({page});
        const pageStyle = {
            ...Styles.page[page]
        };
        let popupWidthStyle = '';

        const portalPlans = getSitePrices({site, pageQuery});

        if (page === 'signup' || page === 'signin' || page === 'offer') {
            if (!isInviteOnlySite({site, pageQuery}) && portalPlans.length === 3 && (page === 'signup' || page === 'signin')) {
                popupWidthStyle = ' gh-portal-container-wide';
            }
            if (portalPlans.length <= 1 || !isStripeConfigured) {
                popupWidthStyle = 'gh-portal-container-narrow';
            }
            if (page === 'offer') {
                popupWidthStyle = ' gh-portal-container-wide';
            }
        }
        let cookieBannerText = '';
        let pageClass = page;
        switch (page) {
        case 'signup':
            cookieBannerText = 'Las Cookies deben habilitarse en tu navegador web para registrarte.';
            break;
        case 'signin':
            cookieBannerText = 'Las Cookies deben habilitarse en tu navegador web para iniciar sesión.';
            break;
        case 'accountHome':
            pageClass = 'account-home';
            break;
        case 'accountProfile':
            pageClass = 'account-profile';
            break;
        case 'accountPlan':
            pageClass = 'account-plan';
            break;
        default:
            cookieBannerText = 'Las Cookies deben activarse en tu navegador web.';
            pageClass = page;
            break;
        }

        if (hasMultipleProducts({site}) && (page === 'signup' || page === 'signin')) {
            pageClass += ' multiple-products';
        }

        let className = 'gh-portal-popup-container';

        if (hasMode(['preview'])) {
            pageClass += ' preview';
        }

        if (hasMode(['preview'], {customSiteUrl}) && !site.disableBackground) {
            className += ' preview';
        }

        if (hasMode(['dev'])) {
            className += ' dev';
        }

        const containerClassName = `${className} ${popupWidthStyle} ${pageClass}`;
        return (
            <>
                <div className={'gh-portal-popup-wrapper ' + pageClass} onClick={e => this.handlePopupClose(e)}>
                    <div className={containerClassName} style={pageStyle} ref={node => (this.node = node)} tabIndex={-1}>
                        <CookieDisabledBanner message={cookieBannerText} />
                        {this.renderPopupNotification()}
                        {this.renderActivePage()}
                    </div>
                </div>
                <div className={'gh-portal-powered outside ' + (hasMode(['preview']) ? ' hidden' : '') + pageClass}>
                    <a href='https://ghost.org' target='_blank' rel='noopener noreferrer' onClick={() => {
                        window.open('https://ghost.org', '_blank');
                    }}>
                        <img src="https://static.ghost.org/v4.0.0/images/powered.png" border="0" width="142" height="30" alt="Publish with Ghost" />
                    </a>
                </div>
            </>
        );
    }
}

export default class PopupModal extends React.Component {
    static contextType = AppContext;

    constructor(props) {
        super(props);
        this.state = {
            height: null
        };
    }

    renderCurrentPage(page) {
        const PageComponent = Pages[page];

        return (
            <PageComponent />
        );
    }

    onHeightChange(height) {
        this.setState({height});
    }

    handlePopupClose(e) {
        e.preventDefault();
        if (e.target === e.currentTarget) {
            this.context.onAction('closePopup');
        }
    }

    renderFrameStyles() {
        const {site} = this.context;
        const FrameStyle = getFrameStyles({site});
        const styles = `
            :root {
                --brandcolor: ${this.context.brandColor}
            }
        ` + FrameStyle;
        return (
            <style dangerouslySetInnerHTML={{__html: styles}} />
        );
    }

    renderFrameContainer() {
        const {member, site, customSiteUrl} = this.context;
        const Styles = StylesWrapper({member});

        const frameStyle = {
            ...Styles.frame.common
        };

        let className = 'gh-portal-popup-background';
        if (hasMode(['preview'])) {
            Styles.modalContainer.zIndex = '3999997';
        }

        if (hasMode(['preview'], {customSiteUrl}) && !site.disableBackground) {
            className += ' preview';
        }

        if (hasMode(['dev'])) {
            className += ' dev';
        }

        return (
            <div style={Styles.modalContainer}>
                <Frame style={frameStyle} title="portal-popup" head={this.renderFrameStyles()}>
                    <div className={className} onClick = {e => this.handlePopupClose(e)}></div>
                    <PopupContent />
                </Frame>
            </div>
        );
    }

    render() {
        const {showPopup} = this.context;
        if (showPopup) {
            return this.renderFrameContainer();
        }
        return null;
    }
}
