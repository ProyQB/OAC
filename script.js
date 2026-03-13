// SUPABASE CONFIGURATION 
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6"; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// PRODUCTS (Note: Once you run the SQL I gave you, this array can be deleted)
const products = [
    { id: 1, name: 'ORC Yin-Yang Hoodie', category: 'hoodies', price: 75.00, description: 'Faded grey heavyweight fleece with center-chest Yin-Yang monogram.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_6uier16uier16uie.png', sizes: ['S','M','L','XL'] },
    { id: 2, name: 'ORC Distressed Wide Tee', category: 'shirts', price: 45.00, description: 'Faded black boxy-fit tee with side-seam distressing and monogram detail.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_fzqo6kfzqo6kfzqo.png', sizes: ['S','M','L','XL'] },
    { id: 3, name: 'ORC Monogram Sweats', category: 'sweats', price: 65.00, description: 'Matching faded grey fleece with "ORC" monogram bunched pattern.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_te1a9lte1a9lte1a.png', sizes: ['S','M','L','XL'] },
    { id: 4, name: 'ORC Side-Stripe Sweats', category: 'sweats', price: 85.00, description: 'Acid-wash black wide-leg sweats with cream logo side-striping and branded long drawstrings.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_e0m25oe0m25oe0m2.png', sizes: ['S', 'M', 'L', 'XL'] },
    { id: 5, name: 'ORC Embroidered Denim', category: 'jeans', price: 110.00, description: 'Baggy black acid-wash denim featuring heavy grey ORC embroidery over distressing.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_lnsc6xlnsc6xlnsc.png', sizes: ['30', '32', '34', '36'] },
    { id: 6, name: 'ORC Blue Acid-Wash Denim', category: 'jeans', price: 95.00, description: 'Distressed blue acid-wash baggy jeans with reinforced stitching and industrial detailing.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_2lgu822lgu822lgu.png', sizes: ['30', '32', '34', '36'] },
    { id: 7, name: 'ORC Stencil Beanie', category: 'accessories', price: 35.00, description: 'Hand-teared ribbed knit beanie with faded ORC stencil patch.', image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_rmsyglrmsyglrmsy.png', sizes: ['OS'] }
];

let cart = [];
let currentUser = null;

// MODIFIED: Added call to filterProducts('') to load all products from Supabase on start
document.addEventListener('DOMContentLoaded', async function() {
    filterProducts(''); // NEW: Fetches initial products from Supabase
    setupEventListeners();
    initLogoAnimation();
    
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateAuthMenu();
        await loadCartFromSupabase();
    }
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    document.querySelector('.cart-link').addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
}

// 1. Fix the ReferenceError for the "Start Shopping" button
function scrollToShop() {
    const shopSection = document.getElementById('shop');
    if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// 2. Fix the ReferenceError and data-mapping for Search
async function filterProducts() {
    const searchTerm = document.getElementById('search-input').value;
    const container = document.getElementById('products-container');

    // Query Supabase - searching 'name' and 'category' columns from your screenshot
    const { data: products, error } = await sb
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    // This is the missing function causing the error
function renderProductGrid(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    // If no products were found in Supabase
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items found in ORC collection.</p>';
        return;
    }

    // Build the HTML for each product card
    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <p class="product-price">$${Number(product.price).toFixed(2)}</p>
                <div class="product-sizes" id="sizes-${product.id}">
                    ${(product.sizes || ['OS']).map(size => `
                        <button class="size-btn" data-size="${size}" onclick="selectSize(this, ${product.id})">${size}</button>
                    `).join('')}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// OLD loadProducts simplified
function loadProducts() {
    renderProductGrid(products);
}

// --- REMAINING ORIGINAL FUNCTIONS (Login, Cart, etc.) ---
function selectSize(element, productId) {
    document.querySelectorAll(`#sizes-${productId} .size-btn`).forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

function initLogoAnimation() {
    const logo = document.querySelector('.logo');
    if (logo) {
        setInterval(() => {
            logo.style.textShadow = "0 0 15px rgba(255,255,255,0.8)";
            setTimeout(() => { logo.style.textShadow = "none"; }, 150);
        }, 3000);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { data, error } = await sb.auth.signUp({
        email, password, options: { data: { full_name: name } }
    });
    if (error) { document.getElementById('signup-error').textContent = error.message; } 
    else { showSuccess('Check your email!'); closeLoginModal(); }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { document.getElementById('login-error').textContent = error.message; } 
    else { currentUser = data.user; updateAuthMenu(); await loadCartFromSupabase(); showSuccess('Logged in!'); closeLoginModal(); }
}

async function logout(e) {
    e.preventDefault();
    await sb.auth.signOut();
    currentUser = null; cart = []; updateCartCount(); updateAuthMenu(); showSuccess('Logged out');
}

async function loadCartFromSupabase() {
    if (!currentUser) return;
    const { data, error } = await sb.from('cart_items').select('*').eq('user_id', currentUser.id);
    if (!error) { cart = data; updateCartCount(); }
}

async function addToCart(productId) {
    if (!currentUser) { showError('Please login'); showLoginModal(); return; }
    
    // We try to find in local array first, if not there, we assume it's from Supabase
    let product = products.find(p => p.id === productId);
    
    const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);
    if (!sizeBtn) { showError('Please select a size'); return; }
    const size = sizeBtn.getAttribute('data-size');

    const { data, error } = await sb.from('cart_items').insert([{
        user_id: currentUser.id, product_id: productId, product_name: product.name,
        price: product.price, size: size, quantity: 1
    }]).select();
    if (!error) { cart.push(data[0]); updateCartCount(); showSuccess(`${product.name} added!`); }
}

async function removeFromCart(dbId) {
    const { error } = await sb.from('cart_items').delete().eq('id', dbId);
    if (!error) { cart = cart.filter(item => item.id !== dbId); updateCartCount(); loadCartItems(); }
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = cart.length;
}

function loadCartItems() {
    const container = document.getElementById('cart-items');
    let total = 0;
    container.innerHTML = cart.length ? cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.product_name}</h4>
                    <p>Size: ${item.size} | Qty: ${item.quantity}</p>
                </div>
                <div>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            </div>`;
    }).join('') : '<p style="text-align:center">Cart is empty</p>';
    document.getElementById('cart-total').textContent = total.toFixed(2);
    document.getElementById('checkout-total').textContent = total.toFixed(2);
}

function updateAuthMenu() {
    const menu = document.getElementById('auth-menu');
    const name = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0];
    menu.innerHTML = currentUser 
        ? `<a href="#" class="nav-link" onclick="logout(event)">${name} (Logout)</a>`
        : `<a href="#login" class="nav-link" onclick="showLoginModal()">Login</a>`;
}

function showLoginModal() { document.getElementById('login-modal').classList.add('active'); }
function closeLoginModal() { document.getElementById('login-modal').classList.remove('active'); }
function openCartModal() { loadCartItems(); document.getElementById('cart-modal').classList.add('active'); }
function closeCartModal() { document.getElementById('cart-modal').classList.remove('active'); }
function closeCheckoutModal() { document.getElementById('checkout-modal').classList.remove('active'); }

function showLogin() { 
    document.getElementById('login-form').classList.add('active'); 
    document.getElementById('signup-form').classList.remove('active'); 
}
function showSignup() { 
    document.getElementById('signup-form').classList.add('active'); 
    document.getElementById('login-form').classList.remove('active'); 
}

function proceedToCheckout() {
    if (!cart.length) return showError('Cart is empty');
    closeCartModal();
    document.getElementById('checkout-modal').classList.add('active');
}

async function handleCheckout(e) {
    e.preventDefault();
    await sb.from('cart_items').delete().eq('user_id', currentUser.id);
    cart = []; updateCartCount(); showSuccess('Purchase complete!'); closeCheckoutModal();
}

function showSuccess(msg) {
    const div = document.getElementById('success-message');
    document.getElementById('success-text').textContent = msg;
    div.classList.add('active');
    setTimeout(() => div.classList.remove('active'), 3000);
}

function showError(msg) { alert(msg); }

// --- NEW SUPABASE SEARCH & SCROLL FUNCTIONS ---

// NEW: This fixes the "scrollToShop is not defined" error
function scrollToShop() {
    const shopSection = document.getElementById('shop');
    if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// NEW: This fixes the "filterProducts is not defined" error and uses Supabase
async function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value : '';
    const container = document.getElementById('products-container');

    // Show loading state
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Searching ORC inventory...</p>';

    const { data: filtered, error } = await sb
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (error) {
        console.error("Search Error:", error.message);
        // Fallback to local products if table isn't ready
        const localItems = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        renderProductGrid(localItems);
        return;
    }

    renderProductGrid(filtered);
}
