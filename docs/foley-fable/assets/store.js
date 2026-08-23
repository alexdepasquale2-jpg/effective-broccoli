(function () {
  'use strict';

  var ORDER_EMAIL = 'slashleyx06@gmail.com';
  var STORAGE_KEY = 'foley-fable-cart';
  var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/' + ORDER_EMAIL;

  var PRODUCTS = [
    {
      id: 'romance',
      title: 'Romance After Dark Blind Book Date',
      price: 17,
      mood: 'Romance',
      deluxe: false,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
      blurb: 'A late-night love story, wrapped and wax-sealed.'
    },
    {
      id: 'dark',
      title: 'Dark & Twisted Blind Book Date',
      price: 17,
      mood: 'Dark & Twisted',
      deluxe: false,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80',
      blurb: 'Shadows, secrets, and a story that stays with you.'
    },
    {
      id: 'cozy',
      title: 'Cozy & Curious Blind Book Date',
      price: 17,
      mood: 'Cozy & Curious',
      deluxe: false,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80',
      blurb: 'A gentle mystery for tea, blankets, and rainy evenings.'
    },
    {
      id: 'romance-deluxe',
      title: 'Romance After Dark Deluxe Blind Book Date',
      price: 26,
      mood: 'Romance',
      deluxe: true,
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
      blurb: 'A richer romance date with extra treasures inside.'
    },
    {
      id: 'dark-deluxe',
      title: 'Dark & Twisted Deluxe Blind Book Date',
      price: 26,
      mood: 'Dark & Twisted',
      deluxe: true,
      image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=900&q=80',
      blurb: 'A deluxe descent into darker pages.'
    },
    {
      id: 'cozy-deluxe',
      title: 'Cozy & Curious Deluxe Blind Book Date',
      price: 26,
      mood: 'Cozy & Curious',
      deluxe: true,
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80',
      blurb: 'A deluxe cozy date with extras worth lingering over.'
    }
  ];

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  function loadCart() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function findProduct(id) {
    return PRODUCTS.find(function (product) {
      return product.id === id;
    });
  }

  function cartCount(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function cartTotal(cart) {
    return cart.reduce(function (sum, item) {
      var product = findProduct(item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  function addToCart(id) {
    var cart = loadCart();
    var existing = cart.find(function (item) {
      return item.id === id;
    });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: id, quantity: 1 });
    }
    saveCart(cart);
    render();
    showToast('Added to your cart');
  }

  function updateQty(id, quantity) {
    var cart = loadCart().filter(function (item) {
      if (item.id !== id) return true;
      return quantity > 0;
    }).map(function (item) {
      if (item.id === id) item.quantity = quantity;
      return item;
    });
    saveCart(cart);
    render();
  }

  function showToast(message) {
    var toast = document.getElementById('Toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function showView(name) {
    document.querySelectorAll('[data-view]').forEach(function (view) {
      view.classList.toggle('is-active', view.getAttribute('data-view') === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name !== 'home') {
      closeCart();
    }
  }

  function openCart() {
    var drawer = document.getElementById('CartDrawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    var drawer = document.getElementById('CartDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderShop() {
    var grid = document.getElementById('ProductGrid');
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(function (product) {
      return (
        '<article class="product-card reveal is-visible">' +
          (product.deluxe ? '<span class="product-card__badge">Deluxe</span>' : '') +
          '<div class="product-card__media">' +
            '<img class="product-card__image" src="' + product.image + '" alt="' + product.title + '">' +
          '</div>' +
          '<div class="product-card__body">' +
            '<span class="product-card__mood">' + product.mood + '</span>' +
            '<h3 class="product-card__title">' + product.title + '</h3>' +
            '<p style="margin:0 0 0.75rem;color:rgba(244,239,230,0.62);font-size:0.92rem;">' + product.blurb + '</p>' +
            '<span class="product-card__price">' + money(product.price) + '</span>' +
            '<div class="product-card__actions">' +
              '<button type="button" class="btn btn--primary" data-add="' + product.id + '">Add to cart</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderCart() {
    var cart = loadCart();
    var countEl = document.getElementById('CartCount');
    var contents = document.getElementById('CartDrawerContents');
    var count = cartCount(cart);

    if (countEl) {
      countEl.hidden = count === 0;
      countEl.textContent = String(count);
    }

    if (!contents) return;

    if (cart.length === 0) {
      contents.innerHTML =
        '<div class="cart-drawer__empty">' +
          '<p>Your cart is empty</p>' +
          '<button type="button" class="btn btn--secondary" data-close-and-shop style="margin-top:1.5rem;">Continue shopping</button>' +
        '</div>';
      return;
    }

    var rows = cart.map(function (item) {
      var product = findProduct(item.id);
      if (!product) return '';
      return (
        '<div class="cart-item">' +
          '<div class="cart-item__image"><img src="' + product.image + '" alt=""></div>' +
          '<div>' +
            '<h3 class="cart-item__title">' + product.title + '</h3>' +
            '<p class="cart-item__price">' + money(product.price * item.quantity) + '</p>' +
            '<div class="cart-item__controls">' +
              '<div class="quantity-input">' +
                '<button type="button" data-qty-minus="' + product.id + '" aria-label="Decrease">−</button>' +
                '<input type="number" value="' + item.quantity + '" min="1" readonly>' +
                '<button type="button" data-qty-plus="' + product.id + '" aria-label="Increase">+</button>' +
              '</div>' +
              '<button type="button" class="cart-item__remove" data-remove="' + product.id + '">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    contents.innerHTML =
      rows +
      '<div class="cart-drawer__footer">' +
        '<div class="cart-drawer__subtotal"><span>Subtotal</span><span>' + money(cartTotal(cart)) + '</span></div>' +
        '<button type="button" class="btn btn--primary cart-drawer__checkout" data-go-checkout>Request this order</button>' +
        '<p style="margin:1rem 0 0;font-size:0.85rem;color:rgba(244,239,230,0.55);text-align:center;">We close the sale by email — no card required yet.</p>' +
      '</div>';
  }

  function renderCheckout() {
    var cart = loadCart();
    var list = document.getElementById('CheckoutItems');
    var total = document.getElementById('CheckoutTotal');
    if (!list || !total) return;

    if (cart.length === 0) {
      list.innerHTML = '<li class="order-summary__item"><span>Your cart is empty</span></li>';
      total.textContent = money(0);
      return;
    }

    list.innerHTML = cart.map(function (item) {
      var product = findProduct(item.id);
      if (!product) return '';
      return (
        '<li class="order-summary__item">' +
          '<span>' + product.title + ' × ' + item.quantity + '</span>' +
          '<span>' + money(product.price * item.quantity) + '</span>' +
        '</li>'
      );
    }).join('');
    total.textContent = money(cartTotal(cart));
  }

  function buildOrderText(form) {
    var cart = loadCart();
    var lines = cart.map(function (item) {
      var product = findProduct(item.id);
      if (!product) return '';
      return '- ' + product.title + ' × ' + item.quantity + ' — ' + money(product.price * item.quantity);
    }).filter(Boolean);

    return [
      'New Foley & Fable order request',
      '',
      'CUSTOMER',
      'Name: ' + form.name.value,
      'Email: ' + form.email.value,
      'Phone: ' + (form.phone.value || 'Not provided'),
      '',
      'SHIPPING',
      form.address.value,
      form.city.value + ', ' + form.state.value + ' ' + form.zip.value,
      '',
      'ORDER',
      lines.join('\n'),
      'Subtotal: ' + money(cartTotal(cart)),
      '',
      'NOTES',
      form.notes.value || 'None',
      '',
      'Please reply to close the sale and arrange payment.'
    ].join('\n');
  }

  function setStatus(message, isError) {
    var status = document.getElementById('CheckoutStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function composeLinks(subject, body) {
    return {
      mailto: 'mailto:' + ORDER_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body),
      gmail: 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(ORDER_EMAIL) +
        '&su=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body)
    };
  }

  function fillHiddenOrderFields(form, subject, orderText) {
    var subjectInput = document.getElementById('OrderSubject');
    var nextInput = document.getElementById('OrderNext');
    var replyInput = document.getElementById('OrderReplyTo');
    var detailsInput = document.getElementById('OrderDetails');
    if (subjectInput) subjectInput.value = subject;
    if (replyInput) replyInput.value = form.email.value;
    if (detailsInput) detailsInput.value = orderText;
    if (nextInput) {
      nextInput.value = window.location.origin + window.location.pathname + '?success=1';
    }
  }

  function finishOrder(form, subject, orderText, openComposer) {
    var links = composeLinks(subject, orderText);
    var gmailBtn = document.getElementById('SuccessGmail');
    var mailtoBtn = document.getElementById('SuccessMailto');
    if (gmailBtn) gmailBtn.href = links.gmail;
    if (mailtoBtn) mailtoBtn.href = links.mailto;
    saveCart([]);
    render();
    form.reset();
    showView('success');
    if (openComposer === 'gmail') {
      window.open(links.gmail, '_blank', 'noopener');
    } else if (openComposer === 'mailto') {
      window.location.href = links.mailto;
    }
  }

  function submitOrder(event) {
    event.preventDefault();
    var form = event.target;
    var cart = loadCart();
    var button = form.querySelector('[type="submit"]');
    var via = (event.submitter && event.submitter.getAttribute('data-send-via')) || 'form';

    if (cart.length === 0) {
      setStatus('Add a book date to your cart first.', true);
      return;
    }

    var subject = 'New Foley & Fable order from ' + form.name.value;
    var orderText = buildOrderText(form);
    fillHiddenOrderFields(form, subject, orderText);

    if (via === 'gmail' || via === 'mailto') {
      finishOrder(form, subject, orderText, via);
      return;
    }

    button.disabled = true;
    setStatus('Sending your request…');

    var payload = {
      _subject: subject,
      _template: 'box',
      _captcha: 'false',
      _replyto: form.email.value,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      address: form.address.value,
      city: form.city.value,
      state: form.state.value,
      zip: form.zip.value,
      notes: form.notes.value,
      order: orderText,
      message: orderText
    };

    fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        var contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('form-blocked');
        }
        return response.json().then(function (data) {
          if (!response.ok && !data.success) {
            throw new Error(data.message || 'Could not send request');
          }
          return data;
        });
      })
      .then(function () {
        finishOrder(form, subject, orderText);
        setStatus('');
      })
      .catch(function () {
        setStatus('Opening Gmail so you can send the request…');
        finishOrder(form, subject, orderText, 'gmail');
      })
      .finally(function () {
        button.disabled = false;
      });
  }

  function render() {
    renderShop();
    renderCart();
    renderCheckout();
  }

  function onClick(event) {
    var add = event.target.closest('[data-add]');
    if (add) {
      addToCart(add.getAttribute('data-add'));
      return;
    }

    if (event.target.closest('[data-cart-open]')) {
      openCart();
      return;
    }

    if (event.target.closest('[data-cart-close], [data-close-and-shop]')) {
      closeCart();
      if (event.target.closest('[data-close-and-shop]')) showView('home');
      return;
    }

    var homeLink = event.target.closest('[data-go-home]');
    if (homeLink) {
      showView('home');
      var href = homeLink.getAttribute('href') || '';
      if (href.charAt(0) === '#' && href !== '#home' && href !== '#') {
        setTimeout(function () {
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
      return;
    }

    if (event.target.closest('[data-go-checkout]')) {
      if (loadCart().length === 0) {
        showToast('Your cart is empty');
        return;
      }
      showView('checkout');
      return;
    }

    var minus = event.target.closest('[data-qty-minus]');
    if (minus) {
      var minusId = minus.getAttribute('data-qty-minus');
      var minusItem = loadCart().find(function (item) { return item.id === minusId; });
      if (minusItem) updateQty(minusId, minusItem.quantity - 1);
      return;
    }

    var plus = event.target.closest('[data-qty-plus]');
    if (plus) {
      var plusId = plus.getAttribute('data-qty-plus');
      var plusItem = loadCart().find(function (item) { return item.id === plusId; });
      if (plusItem) updateQty(plusId, plusItem.quantity + 1);
      return;
    }

    var remove = event.target.closest('[data-remove]');
    if (remove) {
      updateQty(remove.getAttribute('data-remove'), 0);
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCart();
  });

  var form = document.getElementById('CheckoutForm');
  if (form) form.addEventListener('submit', submitOrder);

  render();
  if (/[?&]success=1/.test(window.location.search) || window.location.hash === '#success') {
    showView('success');
  } else {
    showView('home');
  }

  window.FoleyFable = {
    openCart: openCart,
    closeCart: closeCart,
    products: PRODUCTS
  };
})();
