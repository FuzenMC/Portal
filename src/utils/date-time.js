export const getDateString = (isoDate) => {
    if (!isoDate) {
        return '';
    }
    const event = new Date(isoDate);
    const options = {year: 'numeric', month: 'short', day: 'numeric'};
    return event.toLocaleDateString('es-ES', options); //Fuzen - Usar es-ES en lugar de en-GB
};
