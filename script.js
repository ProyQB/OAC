// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let currentUser = null;

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', async function() {
    await filterProducts(); // Load products from Supabase
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
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const checkoutForm = document.getElementById('checkout-form');
    
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(signupForm) signupForm.addEventListener('submit', handleSignup);
    if(checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
    
    document.querySelector('.cart-link').addEventListener('click', (e) => { 
        e.preventDefault(); 
        openCartModal(); 
    });
}

// 2. PRODUCT & SEARCH LOGIC
function scrollToShop() {
    const shopSection = document.getElementById('shop');
    if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
}

async function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value : '';
    const container = document.getElementById('products-container');

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
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No items found.</p>';
        return;
    }

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

// 3. CART & AUTH LOGIC
async function addToCart(productId, name, price) {
    if (!currentUser) { 
        alert('Please login to shop'); 
        document.getElementById('login-modal').classList.add('active');
        return; 
    }
    
    const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);
    if (!sizeBtn) { alert('Please select a size'); return; }
    const size = sizeBtn.getAttribute('data-size');

    const { data, error } = await sb.from('cart_items').insert([{
        user_id: currentUser.id, product_id: productId, product_name: name,
        price: price, size: size, quantity: 1
    }]).select();
    
    if (!error) { 
        cart.push(data[0]); 
        updateCartCount(); 
        alert(`${name} added to cart!`);
    }
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = cart.length;
}

// 4. UI HELPERS
function initLogoAnimation() {
    const logo = document.querySelector('.logo');
    if (logo) {
        setInterval(() => {
            logo.style.textShadow = "0 0 15px rgba(255,255,255,0.8)";
            setTimeout(() => { logo.style.textShadow = "none"; }, 150);
        }, 3000);
    }
}

function updateAuthMenu() {
    const menu = document.getElementById('auth-menu');
    if (!menu) return;
    menu.innerHTML = currentUser 
        ? `<a href="#" class="nav-link" onclick="logout(event)">Logout</a>`
        : `<a href="#login" class="nav-link" onclick="showLoginModal()">Login</a>`;
}

async function logout(e) {
    e.preventDefault();
    await sb.auth.signOut();
    currentUser = null; cart = []; updateCartCount(); updateAuthMenu(); location.reload();
}

// MODAL CONTROLS
function showLoginModal() { document.getElementById('login-modal').classList.add('active'); }
function closeLoginModal() { document.getElementById('login-modal').classList.remove('active'); }
function openCartModal() { document.getElementById('cart-modal').classList.add('active'); }
function closeCartModal() { document.getElementById('cart-modal').classList.remove('active'); }

// AUTH HANDLERS
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); } 
    else { location.reload(); }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) { alert(error.message); } 
    else { alert('Check your email for confirmation!'); }
}

async function handleCheckout(e) {
    e.preventDefault();
    alert('Purchase Successful!');
    document.getElementById('checkout-modal').classList.remove('active');
}

async function loadCartFromSupabase() {
    if (!currentUser) return;
    const { data } = await sb.from('cart_items').select('*').eq('user_id', currentUser.id);
    if (data) { cart = data; updateCartCount(); }
}
let canvas;

function openDesigner() {
    document.getElementById('designer-modal').classList.add('active');
    
    // Initialize Fabric Canvas only once
    if (!canvas) {
        canvas = new fabric.Canvas('designCanvas');
        
        // Optional: Add a base template image (like a blank hoodie)
        fabric.Image.fromURL('https://your-domain.com/blank-hoodie.png', function(img) {
            img.set({ selectable: false, evented: false });
            canvas.add(img);
            canvas.sendToBack(img);
        });
    }
}

function closeDesigner() {
    document.getElementById('designer-modal').classList.remove('active');
}

function addText() {
    const text = new fabric.IText('ORC - EDIT ME', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fill: document.getElementById('text-color').value,
        fontSize: 20
    });
    canvas.add(text);
    canvas.setActiveObject(text);
}

function changeColor(color) {
    const active = canvas.getActiveObject();
    if (active) {
        active.set('fill', color);
        canvas.renderAll();
    }
}

function deleteObject() {
    const active = canvas.getActiveObject();
    if (active) {
        canvas.remove(active);
    }
}

async function saveDesign() {
    // 1. Export canvas to Image
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    
    // 2. Here you would call the Supabase upload logic we discussed earlier
    console.log("Saving design...", dataURL);
    showSuccess("Design saved to your profile!");
    closeDesigner();
}
function openDesigner() {
    document.getElementById('designer-modal').classList.add('active');
    
    if (!canvas) {
        canvas = new fabric.Canvas('designCanvas', {
            backgroundColor: '#ffffff' // Keeps the background clean
        });
        
        // Load a reliable blank hoodie template
        fabric.Image.fromURL('https://i.imgur.com/8f8K8Xy.png', function(img) {
            img.scaleToWidth(400);
            img.set({
                left: 0,
                top: 25, // Centers it slightly vertically
                selectable: false,
                evented: false
            });
            canvas.add(img);
            canvas.sendToBack(img);
        }, { crossOrigin: 'anonymous' });
    }
}
