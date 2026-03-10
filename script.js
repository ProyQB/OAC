// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const products = [
    { 
        id: 1, 
        name: 'ORC Yin-Yang Hoodie', 
        category: 'hoodies', 
        price: 75.00, 
        description: 'Faded grey heavyweight fleece with center-chest Yin-Yang monogram.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_6uier16uier16uie.png', 
        sizes: ['S', 'M', 'L', 'XL'] 
    },
    { 
        id: 2, 
        name: 'ORC Distressed Wide Tee', 
        category: 'shirts', 
        price: 45.00, 
        description: 'Faded black boxy-fit tee with side-seam distressing and monogram detail.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_fzqo6kfzqo6kfzqo.png', 
        sizes: ['S', 'M', 'L', 'XL'] 
    },
    { 
        id: 3, 
        name: 'ORC Monogram Sweats', 
        category: 'sweats', 
        price: 65.00, 
        description: 'Matching faded grey fleece with "ORC" monogram bunched pattern.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_te1a9lte1a9lte1a.png', 
        sizes: ['S', 'M', 'L', 'XL'] 
    }
];

let cart = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    loadProducts();
    setupEventListeners();
    initLogoAnimation(); // Added logo pulse effect
    
    // Check for existing session on load
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

// PRODUCT LOADING
function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-sizes" id="sizes-${product.id}">
                    ${product.sizes.map(size => `<button class="size-btn" data-size="${size}" onclick="selectSize(this, ${product.id})">${size}</button>`).join('')}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function selectSize(element, productId) {
    document.querySelectorAll(`#sizes-${productId} .size-btn`).forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

// STENCIL LOGO ANIMATION
function initLogoAnimation() {
    const logo = document.querySelector('.logo');
    if (logo) {
        setInterval(() => {
            logo.style.textShadow = "0 0 15px rgba(255,255,255,0.8)";
            setTimeout(() => {
                logo.style.textShadow = "none";
            }, 150);
        }, 3000);
    }
}

// AUTH FUNCTIONS (SUPABASE)
async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data, error } = await sb.auth.signUp({
        email, password, options: { data: { full_name: name } }
    });

    if (error) {
        document.getElementById('signup-error').textContent = error.message;
    } else {
        showSuccess('Check your email for the confirmation link!');
        closeLoginModal();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        document.getElementById('login-error').textContent = error.message;
    } else {
        currentUser = data.user;
        updateAuthMenu();
        await loadCartFromSupabase();
        showSuccess('Logged in!');
        closeLoginModal();
    }
}

async function logout(e) {
    e.preventDefault();
    await sb.auth.signOut();
    currentUser = null;
    cart = [];
    updateCartCount();
    updateAuthMenu();
    showSuccess('Logged out');
}

// CART FUNCTIONS (SUPABASE)
async function loadCartFromSupabase() {
    if (!currentUser) return;
    const { data, error } = await sb.from('cart_items').select('*').eq('user_id', currentUser.id);
    if (!error) {
        cart = data;
        updateCartCount();
    }
}

async function addToCart(productId) {
    if (!currentUser) {
        showError('Please login to add items to cart');
        showLoginModal();
        return;
    }

    const product = products.find(p => p.id === productId);
    const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);
    
    if (!sizeBtn) {
        showError('Please select a size');
        return;
    }
    const size = sizeBtn.getAttribute('data-size');

    const { data, error } = await sb.from('cart_items').insert([{
        user_id: currentUser.id,
        product_id: productId,
        product_name: product.name,
        price: product.price,
        size: size,
        quantity: 1
    }]).select();

    if (!error) {
        cart.push(data[0]);
        updateCartCount();
        showSuccess(`${product.name} added to cloud cart!`);
    }
}

async function removeFromCart(dbId) {
    const { error } = await sb.from('cart_items').delete().eq('id', dbId);
    if (!error) {
        cart = cart.filter(item => item.id !== dbId);
        updateCartCount();
        loadCartItems();
    }
}

// UI HELPERS
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

// MODAL CONTROLS
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
    cart = [];
    updateCartCount();
    showSuccess('Purchase complete! Cart cleared from database.');
    closeCheckoutModal();
}

function showSuccess(msg) {
    const div = document.getElementById('success-message');
    document.getElementById('success-text').textContent = msg;
    div.classList.add('active');
    setTimeout(() => div.classList.remove('active'), 3000);
}

function showError(msg) { alert(msg); }
function scrollToShop() { document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); }

function filterProducts() {
    const term = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.querySelector('.product-name').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'block' : 'none';
    });
}
