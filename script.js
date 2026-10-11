// ================= API CONFIG =================
const API_URL = 'http://localhost:3000/api';

// ================= ORDERS =================
async function saveOrder() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    alert("⚠️ Please login to place order!");
    return;
  }

  if (cart.length === 0) {
    alert("⚠️ Cart is empty!");
    return;
  }

  const orderData = {
    username: user.username,
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();

    if (result.success) {
      alert("✅ Order placed successfully!");
      localStorage.setItem("cart", JSON.stringify([]));
      updateCartUI();
      updateHomeCartCount();
      loadFarmerProducts(); // Refresh stock
    } else {
      alert("❌ Failed to place order: " + result.error);
    }
  } catch (error) {
    console.error("Error placing order:", error);
    alert("❌ Error placing order");
  }
}

// ================= CART HANDLING =================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(name, price, image, farmerUsername, stockAvailable) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Find existing product from same farmer
  const existing = cart.find(item => item.name === name && item.farmer === farmerUsername);

  if (existing) {
    // Stock check
    if (existing.quantity + 1 > stockAvailable) {
      alert("⚠️ Not enough stock available!");
      return;
    }
    existing.quantity += 1;
  } else {
    // Stock check for new product
    if (stockAvailable <= 0) {
      alert("⚠️ This product is out of stock!");
      return;
    }

    cart.push({
      name,
      price,
      image,
      img: image,
      farmer: farmerUsername,
      quantity: 1
    });
  }

  // Save cart and update UI
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  updateHomeCartCount();
  showToast("✔ Item added to cart");
}


function increaseQuantity(index) {
  cart[index].quantity++;
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  updateHomeCartCount();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) cart[index].quantity--;
  else cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  updateHomeCartCount();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  updateHomeCartCount();
}

function updateCartUI() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, i) => {
    total += item.price * item.quantity;
    count += item.quantity;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="cart-item-left">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>₹${item.price} per unit</p>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${i})" class="qty-btn">−</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQuantity(${i})" class="qty-btn">+</button>
        </div>
        <button onclick="removeFromCart(${i})">Remove</button>
        <p class="item-total">₹${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    `;
    cartItems.appendChild(li);
  });

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">🛒 Your cart is empty</p>`;
  }

  cartCount.textContent = count;
  cartTotal.textContent = total.toFixed(2);
}

function checkoutCart() {
  if (!cart.length) {
    alert("Cart is empty");
    return;
  }
  saveOrder();
}

function toggleCart() {
  window.location.href = "cart.html";
}

function goHome() {
  document.getElementById("cartSidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateHomeCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const icon = document.getElementById("cart-count");
  if (icon) icon.textContent = count;
}

// ================= LOGIN HANDLING =================
function resetLoginForm() {
  document.getElementById("loginForm").reset();
  ["mobile", "email", "password", "address"].forEach(id =>
    document.getElementById(id).style.display = "none"
  );
  document.getElementById("roleSpecificInputs").innerHTML = "";
}

function openLogin(role) {
  resetLoginForm();
  document.getElementById("loginTitle").textContent = `${role} Login`;
  document.getElementById("loginForm").setAttribute("data-role", role); // Keep case sensitive for display but handle logic carefully
  document.getElementById("loginModal").style.display = "block";

  if (role === "Admin") {
    document.getElementById("roleSpecificInputs").innerHTML = "🔑 Admin Access";
    document.getElementById("password").style.display = "block";
  }

  if (role === "Farmer") {
    document.getElementById("roleSpecificInputs").innerHTML = "🌾 Farmer Access";
    ["mobile", "email", "password", "address"].forEach(id => document.getElementById(id).style.display = "block");
  }

  if (role === "Customer") {
    document.getElementById("roleSpecificInputs").innerHTML = "🛍️ Customer Access";
    ["mobile", "email", "address"].forEach(id => document.getElementById(id).style.display = "block");
  }
}

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
  resetLoginForm();
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const role = this.getAttribute("data-role");
  const username = document.getElementById("username").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const address = document.getElementById("address").value.trim();

  // Try login first
  try {
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const loginData = await loginRes.json();

    if (loginRes.ok) {
      alert("Logged in successfully");
      localStorage.setItem("loggedInRole", role);
      localStorage.setItem("loggedInUser", JSON.stringify(loginData));
      if (role === 'Admin') window.location.href = "admin.html";
      else showAccountMenu();
      closeLoginModal();
      return;
    }

    // If login failed, try register (only for Farmer/Customer if not found)
    if (loginData.error === "User not found" && role !== 'Admin') {
      const regRes = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, mobile, email, address })
      });
      const regData = await regRes.json();

      if (regRes.ok) {
        alert("Registered and logged in");
        localStorage.setItem("loggedInRole", role);
        localStorage.setItem("loggedInUser", JSON.stringify({ username, role, mobile, email, address }));
        showAccountMenu();
        closeLoginModal();
      } else {
        alert("Registration failed: " + regData.error);
      }
    } else {
      alert("Login failed: " + loginData.error);
    }

  } catch (error) {
    console.error("Auth error:", error);
    alert("Authentication error");
  }
});

// ================= ACCOUNT =================
function showAccountMenu() {
  const role = localStorage.getItem("loggedInRole");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const accountMenu = document.getElementById("accountMenu");
  if (!role || !user) accountMenu.style.display = "none";
  else accountMenu.style.display = "block";
}

function openProfile() {
  const role = (localStorage.getItem("loggedInRole") || "").toLowerCase();
  if (role === "admin") window.location.href = "admin.html";
  else if (role === "farmer") window.location.href = "farmer.html";
  else if (role === "customer") window.location.href = "customer-dashboard.html";
  else {
    localStorage.removeItem("loggedInRole");
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("loggedInRole");
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

// ================= SEARCH =================
function saveRecentSearch(query) {
  let recent = JSON.parse(localStorage.getItem("recentSearches")) || [];
  if (query && !recent.includes(query)) {
    recent.unshift(query);
    if (recent.length > 5) recent.pop();
    localStorage.setItem("recentSearches", JSON.stringify(recent));
  }
}

function showSuggestions() {
  const input = document.getElementById("combinedSearchInput");
  const dropdown = document.getElementById("recentSearches");
  const query = input.value.toLowerCase();
  dropdown.innerHTML = "";

  const recent = JSON.parse(localStorage.getItem("recentSearches")) || [];
  const allProducts = ["Tomatoes", "Apples", "Roses", "Carrots", "Potatoes", "Bananas", "Mangoes", "Marigold", "Sunflowers"];
  const suggestions = allProducts.filter(p => p.toLowerCase().includes(query));

  if (query && suggestions.length) {
    dropdown.innerHTML = `<div class="dropdown-header">Suggestions</div>`;
    suggestions.forEach(s => {
      const item = document.createElement("div");
      item.className = "recent-item";
      item.textContent = s;
      item.onclick = () => selectSuggestion(s);
      dropdown.appendChild(item);
    });
  }

  if (recent.length) {
    const header = document.createElement("div");
    header.className = "dropdown-header";
    header.textContent = "Recent Searches";
    dropdown.appendChild(header);
    recent.forEach(r => {
      const item = document.createElement("div");
      item.className = "recent-item";
      item.textContent = r;
      item.onclick = () => selectSuggestion(r);
      dropdown.appendChild(item);
    });
  }

  dropdown.style.display = "block";
}

function selectSuggestion(value) {
  document.getElementById("combinedSearchInput").value = value;
  document.getElementById("recentSearches").style.display = "none";
  handleSearch(new Event("submit"));
}

function handleSearch(e) {
  e.preventDefault();
  const query = document.getElementById("combinedSearchInput").value.trim();
  if (!query) return;
  saveRecentSearch(query);
  localStorage.setItem("searchQuery", query);
  window.location.href = "search.html";
}

document.getElementById("combinedSearchInput").addEventListener("input", showSuggestions);
document.addEventListener("click", e => {
  const dropdown = document.getElementById("recentSearches");
  if (!dropdown.contains(e.target) && e.target.id !== "combinedSearchInput") dropdown.style.display = "none";
});

// ================= LOAD PRODUCTS =================
async function loadFarmerProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();

    // Clear existing static products if we have DB products
    // But for now, let's append or replace. The original HTML has static products.
    // If we want to be fully dynamic, we should clear the grid.
    // However, the user might want to keep the static ones for demo if DB is empty.
    // Let's clear it to show real data.
    // Do NOT clear grid to keep static products
    // if (products.length > 0) {
    //   grid.innerHTML = "";
    // }

    products.filter(p => p.approved === 1).forEach(p => {
      const category = (p.category || "other").toLowerCase();
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-category", category);

      const stockText = p.stock > 0 ? `${p.stock} available` : "Out of stock";
      const disabledBtn = p.stock > 0 ? "" : "disabled";

      card.innerHTML = `
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>${p.description || ""}</p>
          <p>₹${p.price}</p>
          <p>${stockText}</p>
          <button ${disabledBtn} onclick="addToCart('${p.name}', ${p.price}, '${p.image}', '${p.farmer_username}', ${p.stock})">
            ${p.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        `;

      grid.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading products:", error);
  }
}



// ================= CATEGORY FILTER =================
function filterProducts(category) {
  const buttons = document.querySelectorAll(".categories button");
  buttons.forEach(btn => btn.classList.remove("active"));
  const clicked = Array.from(buttons).find(b => b.textContent.toLowerCase().includes(category));
  if (clicked) clicked.classList.add("active");

  document.querySelectorAll(".card").forEach(card => {
    card.style.display = (category === "all" || card.getAttribute("data-category") === category) ? "block" : "none";
  });
}

// ================= TOAST =================
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ================= ON LOAD =================
window.onload = function () {
  updateCartUI();
  showAccountMenu();
  loadFarmerProducts(); // Disabled as per user request to keep only static products
  updateHomeCartCount();
};
document.addEventListener("DOMContentLoaded", updateHomeCartCount);

function toggleCategoryDropdown() {
  const list = document.getElementById("categoryList");
  list.style.display = list.style.display === "block" ? "none" : "block";
}

function selectCategory(category) {
  document.getElementById("categoryList").style.display = "none";
  filterProducts(category);
}

