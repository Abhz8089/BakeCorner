


function updateProducts(products) {
    const productGrid = document.querySelector('.row');
    productGrid.innerHTML = '';
  
   
     const productList = Array.isArray(products) ? products : JSON.parse(products); 
    console.log(productList)
    console.log("---product list")
  
    productList.forEach((product) => {
      const productHTML = `
        <div class="col-md-3 col-sm-6 mt-5">
          <div class="product-grid">
            <div class="product-image">
              <a href="#" class="image">
                <img class="pic-1" src="${product.photos && product.photos.length > 0 ? '/' + product.photos[0].fileName : ''}" width="200px" height="200px">
              </a>
              <span class="product-discount-label">-33%</span>
              <ul class="product-links">
                <li><a href="#" data-tip="Add to Wishlist"><i class="fas fa-heart"></i></a></li>
                <li><a href="#" data-tip="Add to Cart" onclick="addToCart('${product._id}')"><i class="fa fa-cart-arrow-down"></i></a></li>
                <li><a href="/view/${product._id}" data-tip="Quick View"><i class="fa fa-search"></i></a></li>
              </ul>
            </div>
            <div class="product-content">
              <ul class="rating">
                <li class="fas fa-star"></li>
                <li class="fas fa-star"></li>
                <li class="fas fa-star"></li>
                <li class="far fa-star"></li>
                <li class="far fa-star"></li>
              </ul>
              <h3 class="title">${product.name}</h3>
              <p>${product.description}</p>
              <div class="price"><span>$90.00</span>₹${product.price}</div>
              <a class="buy-now" href="#">Buy Now</a>
            </div>
          </div>
        </div>
      `;
  
      productGrid.innerHTML += productHTML;
    });
  }