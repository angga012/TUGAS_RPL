document.addEventListener('DOMContentLoaded', () => {
    const sharedScript = document.createElement('script');
    sharedScript.src = 'my-products.js';
    document.body.appendChild(sharedScript);
});
