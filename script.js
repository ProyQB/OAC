// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://qrugfdvdhaxvjqtruzzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZV5TQ1ywOUmB2hPM5DZtnQ_Sgt77oq6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// PRODUCTS
const products = [
    {
        id: 1,
        name: 'ORC Yin-Yang Hoodie',
        category: 'hoodies',
        price: 75.00,
        description: 'Faded grey heavyweight fleece with center-chest Yin-Yang monogram.',
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_6uier16uier16uie.png',
        sizes: ['S','M','L','XL']
    },
    {
        id: 2,
        name: 'ORC Distressed Wide Tee',
        category: 'shirts',
        price: 45.00,
        description: 'Faded black boxy-fit tee with side-seam distressing and monogram detail.',
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_fzqo6kfzqo6kfzqo.png',
        sizes: ['S','M','L','XL']
    },
    {
        id: 3,
        name: 'ORC Monogram Sweats',
        category: 'sweats',
        price: 65.00,
        description: 'Matching faded grey fleece with "ORC" monogram bunched pattern.',
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_te1a9lte1a9lte1a.png',
        sizes: ['S','M','L','XL']
    },
    { 
        id: 4, 
        name: 'ORC Side-Stripe Sweats', 
        category: 'sweats', 
        price: 85.00, 
        description: 'Acid-wash black wide-leg sweats with cream logo side-striping and branded long drawstrings.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_e0m25oe0m25oe0m2.png', 
        sizes: ['S', 'M', 'L', 'XL'] 
    },
    { 
        id: 5, 
        name: 'ORC Embroidered Denim', 
        category: 'jeans', 
        price: 110.00, 
        description: 'Baggy black acid-wash denim featuring heavy grey ORC embroidery over distressing.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_lnsc6xlnsc6xlnsc.png', 
        sizes: ['30', '32', '34', '36'] 
    },
    { 
        id: 6, 
        name: 'ORC Blue Acid-Wash Denim', 
        category: 'jeans', 
        price: 95.00, 
        description: 'Distressed blue acid-wash baggy jeans with reinforced stitching and industrial detailing.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_2lgu822lgu822lgu.png', 
        sizes: ['30', '32', '34', '36'] 
    },
    { 
        id: 7, 
        name: 'ORC Stencil Beanie', 
        category: 'accessories', 
        price: 35.00, 
        description: 'Hand-teared ribbed knit beanie with faded ORC stencil patch.', 
        image: 'https://qrugfdvdhaxvjqtruzzq.supabase.co/storage/v1/object/public/product-images/Gemini_Generated_Image_rmsyglrmsyglrmsy.png', 
        sizes: ['OS'] 
    }
];

let cart = [];
let currentUser = null;

// INITIAL LOAD
document.addEventListener('DOMContentLoaded', async function(){

loadProducts();
setupEventListeners();
initLogoAnimation();

const { data:{ session } } = await sb.auth.getSession();

if(session){
currentUser = session.user;
updateAuthMenu();
await loadCartFromSupabase();
}

});

// EVENT LISTENERS
function setupEventListeners(){

document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('signup-form').addEventListener('submit', handleSignup);
document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

document.querySelector('.cart-link').addEventListener('click',(e)=>{
e.preventDefault();
openCartModal();
});

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
</div>

<button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>

</div>

</div>

`).join('');

}

function selectSize(el,productId){

document.querySelectorAll(`#sizes-${productId} .size-btn`).forEach(btn=>btn.classList.remove('active'));
el.classList.add('active');

}

// LOGO ANIMATION
function initLogoAnimation(){

const logo = document.querySelector('.logo');

if(logo){

setInterval(()=>{
logo.style.textShadow="0 0 15px rgba(255,255,255,0.8)";
setTimeout(()=>logo.style.textShadow="none",150);
},3000);

}

}

// SIGNUP (UPDATED VERSION)
/*async function handleSignup(e){

e.preventDefault();

const name = document.getElementById('full_name').value;
const email = document.getElementById('email').value;
//const password = document.getElementById('signup-password').value;

const { data, error } = await sb.auth.signUp({
email,
password,
options:{ data:{ full_name:name } }
});

if(error){

console.error(error);
document.getElementById('signup-error').textContent = error.message;
return;

}

// insert profile in public.users
if(data.user){

const { error:insertError } = await sb.from('users').insert({
id: data.user.id,
full_name: name,
email: email
});

if(insertError){
console.error(insertError);
}

showSuccess("Account created!");
closeLoginModal();

}

}*/

async function handleSignup(e){

  e.preventDefault();

  console.log("Signup started");

  const name = document.getElementById('signup-name')?.value;
  const email = document.getElementById('signup-email')?.value;
  const password = document.getElementById('signup-password')?.value;

  console.log("Form values:", {
    name,
    email,
    passwordLength: password?.length
  });

  if(!name || !email || !password){
    console.error("Missing fields");
    alert("All signup fields are required");
    return;
  }

  try{

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options:{
        data:{ full_name: name }
      }
    });

    console.log("Signup response:", data);

    if(error){
      console.error("Signup error:", error);
      alert(error.message);
      return;
    }

    const user = data.user;

    if(!user){
      console.error("No user returned");
      return;
    }

    const { error: profileError } = await sb
      .from('users')
      .insert({
        id: user.id,
        full_name: name,
        email: email
      });

    if(profileError){
      console.error("Profile insert error:", profileError);
    }

    alert("Account created successfully");

  }catch(err){

    console.error("Unexpected error:", err);

  }

}

// LOGIN
async function handleLogin(e){

e.preventDefault();

const email = document.getElementById('login-email').value;
const password = document.getElementById('login-password').value;

const { data, error } = await sb.auth.signInWithPassword({
email,
password
});

if(error){

document.getElementById('login-error').textContent = error.message;
return;

}

currentUser = data.user;

updateAuthMenu();
await loadCartFromSupabase();

showSuccess("Logged in!");
closeLoginModal();

}

// LOGOUT
async function logout(e){

e.preventDefault();

await sb.auth.signOut();

currentUser = null;
cart = [];

updateCartCount();
updateAuthMenu();

showSuccess("Logged out");

}

// LOAD CART
async function loadCartFromSupabase(){

if(!currentUser) return;

const { data } = await sb
.from('cart_items')
.select('*')
.eq('user_id',currentUser.id);

cart = data || [];

updateCartCount();

}

// ADD TO CART
async function addToCart(productId){

if(!currentUser){
showError("Please login first");
showLoginModal();
return;
}

const product = products.find(p=>p.id===productId);
const sizeBtn = document.querySelector(`#sizes-${productId} .size-btn.active`);

if(!sizeBtn){
showError("Select size");
return;
}

const size = sizeBtn.dataset.size;

const { data, error } = await sb.from('cart_items').insert([{
user_id: currentUser.id,
product_id: productId,
product_name: product.name,
price: product.price,
size,
quantity:1
}]).select();

if(!error){

cart.push(data[0]);
updateCartCount();

showSuccess(product.name+" added to cart");

}

}

// REMOVE CART ITEM
async function removeFromCart(id){

await sb.from('cart_items').delete().eq('id',id);

cart = cart.filter(i=>i.id!==id);

updateCartCount();
loadCartItems();

}

// CART UI
function updateCartCount(){

const el=document.getElementById('cart-count');
if(el) el.textContent = cart.length;

}

function loadCartItems(){

const container=document.getElementById('cart-items');

let total=0;

container.innerHTML = cart.map(item=>{

total += item.price * item.quantity;

return`

<div class="cart-item">

<div>
<h4>${item.product_name}</h4>
<p>Size:${item.size} | Qty:${item.quantity}</p>
</div>

<div>
<div>$${(item.price*item.quantity).toFixed(2)}</div>
<button onclick="removeFromCart('${item.id}')">Remove</button>
</div>

</div>

`;

}).join('');

document.getElementById('cart-total').textContent = total.toFixed(2);
document.getElementById('checkout-total').textContent = total.toFixed(2);

}

// AUTH MENU
function updateAuthMenu(){

const menu=document.getElementById('auth-menu');

const name=currentUser?.user_metadata?.full_name || currentUser?.email;

menu.innerHTML = currentUser
? `<a href="#" onclick="logout(event)">${name} (Logout)</a>`
: `<a href="#" onclick="showLoginModal()">Login</a>`;

}

// MODALS
function showLoginModal(){document.getElementById('login-modal').classList.add('active');}
function closeLoginModal(){document.getElementById('login-modal').classList.remove('active');}

function openCartModal(){
loadCartItems();
document.getElementById('cart-modal').classList.add('active');
}

function closeCartModal(){document.getElementById('cart-modal').classList.remove('active');}

function proceedToCheckout(){

if(!cart.length){
showError("Cart empty");
return;
}

closeCartModal();
document.getElementById('checkout-modal').classList.add('active');

}

// CHECKOUT
async function handleCheckout(e){

e.preventDefault();

await sb.from('cart_items').delete().eq('user_id',currentUser.id);

cart=[];
updateCartCount();

showSuccess("Purchase complete");

document.getElementById('checkout-modal').classList.remove('active');

}

// UI MESSAGES
function showSuccess(msg){

const div=document.getElementById('success-message');

document.getElementById('success-text').textContent=msg;

div.classList.add('active');

setTimeout(()=>div.classList.remove('active'),3000);

}

function showError(msg){
alert(msg);
}

// SEARCH
function filterProducts(){

const term=document.getElementById('search-input').value.toLowerCase();

document.querySelectorAll('.product-card').forEach(card=>{

const name = card.querySelector('.product-name').textContent.toLowerCase();

card.style.display = name.includes(term) ? "block" : "none";

});

}
