// 1. DATABASE SETUP
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let currentUser = null;

// 2. APP STARTUP
document.addEventListener('DOMContentLoaded', async function() {
    await filterProducts(); 
    setupEventListeners();
    
    // Check if a user is already logged in
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

// 3. SHOPPING LOGIC
async function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value : '';
    
    const { data: products, error } = await sb
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

    if (!error) renderProductGrid(products);
}

function renderProductGrid(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="product-image"><img src="${product.image}" alt="${product.name}"></div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>$${Number(product.price).toFixed(2)}</p>
                <div class="product-sizes" id="sizes-${product.id}">
                    ${(product.sizes || []).map(size => `
                        <button class="size-btn" data-size="${size}" onclick="selectSize(this, ${product.id})">${size}</button>
                    `).join('')}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function selectSize(element, productId) {
    document.querySelectorAll(`#sizes-${productId} .size-btn`).forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

// 4. CART & REMOVE LOGIC (Fixes the "Token" error)
function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        totalElement.textContent = '0.00';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map((item, index) => {
        total += Number(item.price);
        // We use '${item.id}' with quotes to prevent the SyntaxError seen in your console
        return `
            <div class="cart-item" style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #333;">
                <div><h4>${item.product_name}</h4><p>Size: ${item.size}</p></div>
                <div style="text-align:right;">
                    <p>$${Number(item.price).toFixed(2)}</p>
                    <button onclick="removeFromCart(${index}, '${item.id}')" style="color:red; background:none; border:none; cursor:pointer;">Remove</button>
                </div>
            </div>`;
    }).join('');
    totalElement.textContent = total.toFixed(2);
}

async function addToCart(productId, name, price) {
    if (!currentUser) return showLoginModal();
    const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);
    if (!sizeBtn) return alert('Select a size');

    const { data, error } = await sb.from('cart_items').insert([{
        user_id: currentUser.id, product_id: productId, product_name: name,
        price: price, size: sizeBtn.getAttribute('data-size'), quantity: 1
    }]).select();
    
    if (!error) { cart.push(data[0]); updateCartCount(); alert('Added!'); }
}

async function removeFromCart(index, supabaseId) {
    const { error } = await sb.from('cart_items').delete().eq('id', supabaseId);
    if (!error) {
        cart.splice(index, 1);
        updateCartCount();
        renderCartItems();
    }
}

// 5. AUTH HANDLERS (Fixes "handleSignup is not defined")
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
    if (error) alert(error.message); else alert('Check your email!');
}

async function logout(e) {
    e.preventDefault();
    await sb.auth.signOut();
    location.reload();
}

// 6. UI & MODALS
function updateCartCount() { document.getElementById('cart-count').textContent = cart.length; }
function openCartModal() { renderCartItems(); document.getElementById('cart-modal').classList.add('active'); }
function closeCartModal() { document.getElementById('cart-modal').classList.remove('active'); }
function showLoginModal() { document.getElementById('login-modal').classList.add('active'); }
function closeLoginModal() { document.getElementById('login-modal').classList.remove('active'); }

function proceedToCheckout() {
    closeCartModal();
    document.getElementById('checkout-modal').classList.add('active');
    document.getElementById('checkout-total').textContent = document.getElementById('cart-total').textContent;
}

async function handleCheckout(e) {
    e.preventDefault();
    alert('Order Placed!');
    document.getElementById('checkout-modal').classList.remove('active');
}

function updateAuthMenu() {
    const menu = document.getElementById('auth-menu');
    if (menu) menu.innerHTML = currentUser 
        ? `<a href="#" onclick="logout(event)">Logout</a>`
        : `<a href="#" onclick="showLoginModal()">Login</a>`;
}

async function loadCartFromSupabase() {
    const { data } = await sb.from('cart_items').select('*').eq('user_id', currentUser.id);
    if (data) { cart = data; updateCartCount(); }
}
