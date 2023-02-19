import { select, settings, templates, classNames } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {
      toggleTrigger: element.querySelector(select.cart.toggleTrigger),
      productList: element.querySelector(select.cart.productList),
      deliveryFee: element.querySelector(select.cart.deliveryFee),
      subtotalPrice: element.querySelector(select.cart.subtotalPrice),
      totalPrice: element.querySelectorAll(select.cart.totalPrice),
      totalNumber: element.querySelector(select.cart.totalNumber),
      form: element.querySelector(select.cart.form),
      phone: element.querySelector(select.cart.phone),
      address: element.querySelector(select.cart.address),
    };

    thisCart.dom.wrapper = element;
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  sendOrder() {
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.totalPrice - settings.cart.defaultDeliveryFee,
      totalNumber: thisCart.totalNumber,
      deliveryFee: settings.cart.defaultDeliveryFee,
      products: [],
    };
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    console.log('payload:', payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }

  remove(event) {
    const thisCart = this;
    console.log('event: ', event);

    event.dom.wrapper.remove();

    const productToRemove = thisCart.products.indexOf(event);
    //console.log('full cart: ', thisCart.products);
    //console.log('productToREmove', productToRemove);

    thisCart.products.splice(productToRemove, 1);
    //console.log('current cart: ', thisCart.products);

    thisCart.update();
  }

  add(menuProduct) {
    const thisCart = this;

    /* generate HTML Based on template */
    const generatedHTML = templates.cartProduct(menuProduct);

    /* create const with DOM element using utilis.createElementFromHTML */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    /* add element to cart */
    thisCart.dom.productList.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }

  update() {
    const thisCart = this;

    const deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0; // liczba całościowa sztuk w koszyku
    thisCart.subtotalPrice = 0; //cena koszyka bez dostawy

    for (let product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }
    //console.log (thisCart.products);

    if (thisCart.subtotalPrice != 0) {
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
    } else {
      thisCart.totalPrice = 0;
    }

    console.log(
      'product amount: ',
      thisCart.totalNumber,
      'price without delivery: ',
      thisCart.subtotalPrice,
      'total cart price: ',
      thisCart.totalPrice
    );

    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    for (let totalPrice of thisCart.dom.totalPrice) {
      totalPrice.innerHTML = thisCart.totalPrice;
    }
  }
}

export default Cart;
