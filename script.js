/* =========================================================
   Quick Discount Calculator - script.js
   Plain JavaScript. No frameworks, no build step, no data.

     1. Helpers (money, numbers, errors)
     2. Tabs
     3. Single discount
     4. Successive discounts
     5. Compare two offers
     6. Clear buttons
     7. Start-up
   ========================================================= */

'use strict';

/* ---------------------------------------------------------
   1. Helpers
   --------------------------------------------------------- */

var CURRENCIES = {
  INR: { locale: 'en-IN', symbol: '\u20B9' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '\u20AC' },
  GBP: { locale: 'en-GB', symbol: '\u00A3' }
};

var currentCurrency = 'INR';

/* Shortcut for document.getElementById. */
function byId(id) {
  return document.getElementById(id);
}

/* Format a number as money in the chosen currency. */
function formatMoney(value) {
  return new Intl.NumberFormat(CURRENCIES[currentCurrency].locale, {
    style: 'currency',
    currency: currentCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/* Format a number as a percentage, e.g. 28 becomes "28%". */
function formatPercent(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value) + '%';
}

/*
   Read a number the user typed.
   Returns { ok, value, empty, error }:
     empty : the box is blank (not an error, just not filled in yet)
     ok    : the value is valid and ready to use
     error : a message to show underneath the box
*/
function readNumber(rawText, options) {
  var settings = options || {};
  var max = typeof settings.max === 'number' ? settings.max : Infinity;
  var label = settings.label || 'Value';

  var text = String(rawText == null ? '' : rawText).trim();

  if (text === '') {
    return { ok: false, empty: true, error: '' };
  }

  /* Allow pasted values such as "1,000" or "$1,000". */
  var cleaned = text.replace(/[,\s$€£₹]/g, '');

  /* Still being typed: "-", "." and "-." have no digits yet, so stay quiet. */
  if (/^[-.]*$/.test(cleaned)) {
    return { ok: false, empty: true, error: '' };
  }

  /*
     Valid = an optional minus, then digits with at most one dot.
     The trailing part allows "5." because people type that on the way to "5.5".
  */
  if (!/\d/.test(cleaned) || !/^-?\d*\.?\d*$/.test(cleaned)) {
    return { ok: false, error: label + ' must be a number.' };
  }

  var value = Number(cleaned);

  if (!isFinite(value)) {
    return { ok: false, error: label + ' must be a number.' };
  }
  if (value < 0) {
    return { ok: false, error: label + " can't be negative." };
  }
  if (value > max) {
    return { ok: false, error: label + " can't be more than " + max.toLocaleString('en-US') + '.' };
  }

  return { ok: true, value: value };
}

function readPrice(rawText, label) {
  return readNumber(rawText, { max: 1000000000000, label: label || 'Price' });
}

function readPercent(rawText, label) {
  return readNumber(rawText, { max: 100, label: label || 'Discount' });
}

/* Show or clear the error message attached to an input box. */
function setFieldError(input, errorElement, message) {
  errorElement.textContent = message || '';
  input.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

/* A short way to write "return the message only when the field is invalid". */
function errorFor(result) {
  return result.ok || result.empty ? '' : result.error;
}

/* ---------------------------------------------------------
   2. Tabs
   --------------------------------------------------------- */

var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab'));

function activateTab(tab) {
  tabButtons.forEach(function (button) {
    var isActive = button === tab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.tabIndex = isActive ? 0 : -1;
    byId(button.getAttribute('aria-controls')).hidden = !isActive;
  });
}

tabButtons.forEach(function (tab, index) {
  tab.addEventListener('click', function () {
    activateTab(tab);
  });

  tab.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    var step = event.key === 'ArrowRight' ? 1 : -1;
    var next = tabButtons[(index + step + tabButtons.length) % tabButtons.length];
    activateTab(next);
    next.focus();
  });
});

/* ---------------------------------------------------------
   3. Single discount
   --------------------------------------------------------- */

function calculateSingle() {
  var priceInput = byId('s-price');
  var discountInput = byId('s-discount');

  var price = readPrice(priceInput.value, 'Price');
  var discount = readPercent(discountInput.value, 'Discount');

  setFieldError(priceInput, byId('s-price-error'), errorFor(price));
  setFieldError(discountInput, byId('s-discount-error'), errorFor(discount));

  if (!price.ok || !discount.ok) {
    byId('s-save').textContent = '\u2014';
    byId('s-final').textContent = '\u2014';
    return;
  }

  var saved = price.value * discount.value / 100;
  byId('s-save').textContent = formatMoney(saved);
  byId('s-final').textContent = formatMoney(price.value - saved);
}

/* ---------------------------------------------------------
   4. Successive discounts
   --------------------------------------------------------- */

function successiveRows() {
  return Array.prototype.slice.call(document.querySelectorAll('#x-discounts .discount-row'));
}

function addDiscountRow() {
  var row = document.createElement('div');
  row.className = 'discount-row';
  row.innerHTML =
    '<div class="input-group has-suffix">' +
      '<input class="discount-input" type="text" inputmode="decimal" autocomplete="off" ' +
        'placeholder="Discount %" aria-label="Discount percentage">' +
      '<span class="suffix" aria-hidden="true">%</span>' +
    '</div>' +
    '<button type="button" class="icon-btn remove-btn" aria-label="Remove this discount">&times;</button>' +
    '<p class="error" role="alert"></p>';

  row.querySelector('.discount-input').addEventListener('input', calculateSuccessive);

  row.querySelector('.remove-btn').addEventListener('click', function () {
    row.remove();
    refreshRemoveButtons();
    calculateSuccessive();
  });

  byId('x-discounts').appendChild(row);
  refreshRemoveButtons();
  return row;
}

/* Keep the remove buttons enabled, and their labels in step with the row order. */
function refreshRemoveButtons() {
  var rows = successiveRows();
  rows.forEach(function (row, index) {
    var position = index + 1;
    row.querySelector('.remove-btn').disabled = rows.length <= 1;
    row.querySelector('.remove-btn').setAttribute('aria-label', 'Remove discount ' + position);
    row.querySelector('.discount-input').setAttribute('aria-label', 'Discount ' + position + ' percent');
  });
}

function calculateSuccessive() {
  var priceInput = byId('x-price');
  var price = readPrice(priceInput.value, 'Price');
  setFieldError(priceInput, byId('x-price-error'), errorFor(price));

  /* Each discount multiplies what is left of the price. */
  var factor = 1;
  var blocked = false;

  successiveRows().forEach(function (row) {
    var input = row.querySelector('.discount-input');
    var discount = readPercent(input.value, 'Discount');

    setFieldError(input, row.querySelector('.error'), errorFor(discount));

    if (discount.ok) {
      factor = factor * (1 - discount.value / 100);
    } else if (!discount.empty) {
      blocked = true;
    }
  });

  if (!price.ok || blocked) {
    byId('x-save').textContent = '\u2014';
    byId('x-effective').textContent = '\u2014';
    byId('x-final').textContent = '\u2014';
    return;
  }

  var finalPrice = price.value * factor;
  var saved = price.value - finalPrice;
  var effective = price.value === 0 ? 0 : (saved / price.value) * 100;

  byId('x-save').textContent = formatMoney(saved);
  byId('x-effective').textContent = formatPercent(effective);
  byId('x-final').textContent = formatMoney(finalPrice);
}

/* ---------------------------------------------------------
   5. Compare two offers
   --------------------------------------------------------- */

var OFFER_KEYS = ['a', 'b'];

function calculateCompare() {
  var results = OFFER_KEYS.map(function (key) {
    var priceInput = byId(key + '-price');
    var discountInput = byId(key + '-discount');
    var finalElement = byId(key + '-final');
    var card = byId('offer-' + key);

    var price = readPrice(priceInput.value, 'Price');
    var discount = readPercent(discountInput.value, 'Discount');

    setFieldError(priceInput, byId(key + '-price-error'), errorFor(price));
    setFieldError(discountInput, byId(key + '-discount-error'), errorFor(discount));

    card.classList.remove('is-best', 'is-worst');

    if (!price.ok || !discount.ok) {
      finalElement.textContent = '\u2014';
      return null;
    }

    var finalPrice = price.value - (price.value * discount.value / 100);
    finalElement.textContent = formatMoney(finalPrice);
    return { key: key, card: card, finalPrice: finalPrice };
  });

  var verdict = byId('verdict');
  var first = results[0];
  var second = results[1];

  if (!first || !second) {
    verdict.textContent = 'Enter a price and a discount for both offers to compare them.';
    verdict.className = 'verdict';
    return;
  }

  var difference = Math.abs(first.finalPrice - second.finalPrice);

  if (difference < 0.005) {
    verdict.textContent = 'Both offers end up costing the same.';
    verdict.className = 'verdict is-tie';
    return;
  }

  var better = first.finalPrice < second.finalPrice ? first : second;
  var worse = better === first ? second : first;

  better.card.classList.add('is-best');
  worse.card.classList.add('is-worst');

  verdict.textContent = 'Offer ' + better.key.toUpperCase() + ' is better: you pay ' +
    formatMoney(better.finalPrice) + ', which is ' + formatMoney(difference) +
    ' less than Offer ' + worse.key.toUpperCase() + '.';
  verdict.className = 'verdict is-win';
}

/* ---------------------------------------------------------
   6. Clear buttons
   --------------------------------------------------------- */

function clearErrorsWithin(root) {
  Array.prototype.forEach.call(root.querySelectorAll('.is-invalid'), function (input) {
    input.classList.remove('is-invalid');
    input.setAttribute('aria-invalid', 'false');
  });

  Array.prototype.forEach.call(root.querySelectorAll('.error'), function (element) {
    element.textContent = '';
  });
}

function renderEverything() {
  calculateSingle();
  calculateSuccessive();
  calculateCompare();
}

function clearSingle() {
  byId('s-price').value = '';
  byId('s-discount').value = '';
  clearErrorsWithin(byId('panel-single'));
  calculateSingle();
}

function clearSuccessive() {
  byId('x-price').value = '';
  byId('x-discounts').innerHTML = '';
  addDiscountRow();
  addDiscountRow();
  clearErrorsWithin(byId('panel-successive'));
  calculateSuccessive();
}

function clearCompare() {
  ['a-price', 'a-discount', 'b-price', 'b-discount'].forEach(function (id) {
    byId(id).value = '';
  });
  clearErrorsWithin(byId('panel-compare'));
  calculateCompare();
}

function clearAll() {
  clearSingle();
  clearSuccessive();
  clearCompare();
}

/* ---------------------------------------------------------
   7. Start-up
   --------------------------------------------------------- */

function updateCurrencySymbols() {
  var symbol = CURRENCIES[currentCurrency].symbol;
  Array.prototype.forEach.call(document.querySelectorAll('[data-symbol]'), function (element) {
    element.textContent = symbol;
  });
}

function init() {
  /* Successive discounts start with two boxes. */
  addDiscountRow();
  addDiscountRow();

  /* Recalculate as the user types. */
  ['s-price', 's-discount'].forEach(function (id) {
    byId(id).addEventListener('input', calculateSingle);
  });

  byId('x-price').addEventListener('input', calculateSuccessive);

  byId('x-add').addEventListener('click', function () {
    var row = addDiscountRow();
    row.querySelector('.discount-input').focus();
    calculateSuccessive();
  });

  ['a-price', 'a-discount', 'b-price', 'b-discount'].forEach(function (id) {
    byId(id).addEventListener('input', calculateCompare);
  });

  byId('currency').addEventListener('change', function (event) {
    currentCurrency = event.target.value;
    updateCurrencySymbols();
    renderEverything();
  });

  byId('s-clear').addEventListener('click', clearSingle);
  byId('x-clear').addEventListener('click', clearSuccessive);
  byId('c-clear').addEventListener('click', clearCompare);
  byId('clear-all').addEventListener('click', clearAll);

  updateCurrencySymbols();
  refreshRemoveButtons();
  renderEverything();
}

init();
