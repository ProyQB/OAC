// 1. CONFIGURATION & GLOBALS
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let currentUser = null;

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', async function() {
    await filterProducts(); 
    setupEventListeners();
    initLogoAnimation();
    
    // Check for existing session
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateAuthMenu();
        await loadCartFromSupabase();
    }
});

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const checkoutForm = document.getElementById('checkout-form');
    
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(signupForm) signupForm.addEventListener('submit', handleSignup);
    if(checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
}

// 3. PRODUCT & SEARCH LOGIC
async function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value : '';
    
    const { data: products, error } = await sb
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }
    renderProductGrid(products);
}

function renderProductGrid(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${Number(product.price).toFixed(2)}</p>
                <div class="product-sizes" id="sizes-${product.id}">
                    ${(product.sizes || []).map(size => `
                        <button class="size-btn" data-size="${size}" onclick="selectSize(this, ${product.id})">${size}</button>
                    `).join('')}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function selectSize(element, productId) {
    document.querySelectorAll(`#sizes-${productId} .size-btn`).forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

// 4. CART & CHECKOUT LOGIC
async function addToCart(productId, name, price) {
    if (!currentUser) { 
        showLoginModal();
        return; 
    }
    
    const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);
    if (!sizeBtn) { alert('Please select a size'); return; }
    
    const { data, error } = await sb.from('cart_items').insert([{
        user_id: currentUser.id, 
        product_id: productId, 
        product_name: name,
        price: price, 
        size: sizeBtn.getAttribute('data-size'), 
        quantity: 1
    }]).select();
    
    if (!error) { 
        cart.push(data[0]); 
        updateCartCount(); 
        alert('Added to cart!');
    }
}

async function removeFromCart(index, supabaseId) {
    // Note: Wrapped ID in quotes in the render function to prevent token errors
    const { error } = await sb.from('cart_items').delete().eq('id', supabaseId);
    if (!error) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartItems();
    }
}

function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Your cart is empty.</p>';
        if(totalElement) totalElement.textContent = '0.00';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map((item, index) => {
        total += Number(item.price);
        return `
            <div class="cart-item" style="display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 10px 0;">
                <div>
                    <h4 style="margin:0;">${item.product_name}</h4>
                    <p style="font-size:0.8rem; color:#888;">Size: ${item.size}</p>
                </div>
                <div style="text-align:right;">
                    <p style="font-weight:bold;">$${Number(item.price).toFixed(2)}</p>
                    <button onclick="removeFromCart(${index}, '${item.id}')" style="color:#ff4444; background:none; border:none; cursor:pointer; text-decoration:underline;">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    if(totalElement) totalElement.textContent = total.toFixed(2);
}

function proceedToCheckout() {
    closeCartModal();
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.classList.add('active');
        const cartTotal = document.getElementById('cart-total').textContent;
        document.getElementById('checkout-total').textContent = cartTotal;
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    alert('Purchase Successful!');
    closeCheckoutModal();
}

// 5. AUTH HANDLERS
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else location.reload();
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) alert(error.message); else alert('Check your email for confirmation!');
}

async function logout(e) {
    e.preventDefault();
    await sb.auth.signOut();
    location.reload();
}

async function loadCartFromSupabase() {
    const { data } = await sb.from('cart_items').select('*').eq('user_id', currentUser.id);
    if (data) { cart = data; updateCartCount(); }
}

// 6. UI & MODAL CONTROLS
function updateCartCount() { 
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.textContent = cart.length; 
}

function updateAuthMenu() {
    const menu = document.getElementById('auth-menu');
    if (menu) menu.innerHTML = currentUser 
        ? `<a href="#" class="nav-link" onclick="logout(event)">Logout</a>`
        : `<a href="#login" class="nav-link" onclick="showLoginModal()">Login</a>`;
}

function openCartModal() {
    renderCartItems();
    document.getElementById('cart-modal').classList.add('active');
}

function closeCartModal() { document.getElementById('cart-modal').classList.remove('active'); }
function showLoginModal() { document.getElementById('login-modal').classList.add('active'); }
function closeLoginModal() { document.getElementById('login-modal').classList.remove('active'); }
function closeCheckoutModal() { document.getElementById('checkout-modal').classList.remove('active'); }
function scrollToShop() { document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); }

function initLogoAnimation() {
    const logo = document.querySelector('.logo');
    if (logo) setInterval(() => {
        logo.style.textShadow = "0 0 15px rgba(255,255,255,0.8)";
        setTimeout(() => logo.style.textShadow = "none", 150);
    }, 3000);
}
