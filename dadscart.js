DC = {};

/***************** Dads Cart! ******************/

DC.currency = '&pound;';
DC.init = function(e){
	// Activate the cart-update and cart-remove buttons
	$('.cart-add, .cart-update, .cart-remove').on('click', DC.update);
	// Activate the review toggling
	$('#cart-link').click(function(e){
		if(!$('#cart-review').is(':animated')){
			$('#cart-review').slideToggle();
			e.stopPropagation();
		}
	});
	$('#cart-review').click(function(e){
		e.stopPropagation();
	});
	$(document).click(function(e){
		if(!$('#cart-review').is(':animated')){
			$('#cart-review').slideUp();
		}
	});
	// Refresh the interface
	DC.refresh();
};
// When yer ready!
$(document).ready(DC.init);

/************* Update, Remove, Empty ************/

DC.update = function(e){
	// Pull out the cart-data
	var cart = DC.get();
	// Reference the cart item
	var item = $(this).closest('.cart-item, .cart-review-item');
	if(!item.length){
		DC.message('unable to add this item (a)');
		return;
	}
	// Build an itemdata object (regardless of the action)
	var itemdata = {};
	// Get attributes from the item itself
	$.extend(itemdata, DC.getDataFromAttributes(item));
	// Get attributes from any selected <option> elements
	var options = item.find('select :selected');
	$.extend(itemdata, DC.getDataFromAttributes(options));
	// Get values from children
	var properties = item.find("[class^=cart-p-], [class*= cart-p-]");
	$.each(properties, function(k,v){
		// The value is either via val() or html()
		var value = $(this).val() || $(this).html();
		// The key can be derived from the class
		var klass = $(this).attr('class');
		var tmp = klass.match(DC.regex);
		// We good?
		if(tmp){
			itemdata[tmp[2]] = value;
		}
	});
	// Defaults: qty = 1, price = 0, href = location.href
	itemdata.qty	= parseInt(itemdata.qty, 10)	|| 1;
	itemdata.price	= parseFloat(itemdata.price)	|| 0;
	itemdata.href	= itemdata.href || location.href;
	// We must have a uid to continue
	if(!itemdata.uid){
		DC.message('unable to add this item (b)');
		return;
	}
	// We remove when clicking .cart-remove or when qty <= 0
	if($(this).hasClass('cart-remove') || itemdata.qty <= 0){
		DC.remove(e, itemdata.uid);
		return;
	}
	// Review items only update the qty...
	if(item.hasClass('cart-review-item')){
		if(itemdata.qty){
			// Update the qty
			cart[itemdata.uid].qty = itemdata.qty;
		}
	} else {
		// Add-to-cart? Update the qty...
		if($(this).hasClass('cart-add') && cart[itemdata.uid]){
			itemdata.qty += cart[itemdata.uid].qty;
		}
		// Set the item
		cart[itemdata.uid] = itemdata;
		// Show a message
		DC.message('cart updated');
	}
	// Store the cart-data
	var cart = $.jStorage.set('dads-cart', cart);
	// Refresh the interface
	DC.refresh();
	// If the review is open, we dont want to close it
	e.stopPropagation();
};
DC.remove = function(e, uid){
	// Pull out the cart-data
	var cart = DC.get();
	// We must have the uid
	if(!uid){
		DC.message('unable to remove this item');
		return;
	}
	// Remove the item
	delete cart[uid];
	// Store the cart-data
	var cart = $.jStorage.set('dads-cart', cart);
	// Show a message
	DC.message('item removed from cart');
	// Refresh the interface
	DC.refresh();
	// If the review is open, we dont want to close it
	e.stopPropagation();
};
DC.empty = function(e){
	// Remove the data
	$.jStorage.deleteKey('dads-cart');
	// ...and refresh
	DC.refresh();
};

/***************** Get, Refresh ******************/

DC.get = function(){
	return $.jStorage.get('dads-cart', {});
};
DC.refresh = function(){
	// Pull out the cart-data
	var cart = DC.get();
	// Populate the totals
	var totals = { items: 0, qty: 0, price: 0 };
	$.each(cart, function(k,v){
		totals.items ++;
		totals.qty += v.qty;
		totals.price += v.qty * v.price;
	});
	// Write em
	$('.cart-total-items').html(totals.items);
	$('.cart-total-qty').html(totals.qty);
	$('.cart-total-price').html(DC.toMoney(totals.price));
	// Update the review list
	$('#cart-review-items').empty();
	$.each(cart, function(k,v){
		// Pull out the template
		var tmpl = $('#cart-review-item-template').html();
		// My simple templating :-)
		$.each(v, function(k2,v2){
			// If its the price, moneyfy it
			if(k2 == 'price'){
				v2 = DC.toMoney(v2);
			}
			var regex = new RegExp('\\${' + k2 + '}', "gi");
			tmpl = tmpl.replace(regex, v2);
		});
		// Add it to the DOM
		var item = $(tmpl);
		// Set the uid
		item.attr('cart-p-uid', k);
		// Add the events (for some reason $.on doesnt catch this)
		item.find('.cart-add, .cart-update, .cart-remove').click(DC.update);
		// Add it
		$('#cart-review-items').append(item);
	});
	// Update the regular items on the page
	$('.cart-item').each(function(k,v){
		// Whats the uid?
		var uid = $(this).attr('cart-p-uid');
		// If we have them in the cart...
		if(cart[uid]){
			// If we havent already, store the "add" text
			if(!$(this).data('cart-add')){
				$(this).data('cart-add', $(this).find('.cart-update').html());
			}
			// Set the val and update text if we can
			$(this).find('.cart-p-qty').val(cart[uid].qty);
			if($(this).find('.cart-update').attr('cart-update')){
				$(this).find('.cart-update').html($(this).find('.cart-update').attr('cart-update'));
			}
			// Is it an auto-hide element?
			if($(this).hasClass('cart-autohide')){
				$(this).show();
			}
		} else {
			// Set the val to 1 and the add text if we can
			$(this).find('.cart-p-qty').val(1);
			if($(this).data('cart-add')){
				$(this).find('.cart-update').html($(this).data('cart-add'));
			}
			// Is it an auto-hide element?
			if($(this).hasClass('cart-autohide')){
				$(this).hide();
			}
		}
	});
};

/****************** Utilities *******************/

DC.regex = /(^|\s)cart-p-(.*)/i; // This regex will match cart-p- attributes and classes
DC.getDataFromAttributes = function(els){
	var data = {};
	// Loop all elements
	$.each(els, function(k, el){
		// Loop all the attributes
		$.each(el.attributes, function(a, b){
			// The key can be derived from the name
			var klass = b.name;
			var tmp = klass.match(DC.regex);
			// Did it match the regex?
			if(tmp){
				data[tmp[2]] = b.value;
			}
		});
	});
	return data;
};
DC.toMoney = function(value){
	// Returns a currency-formatted number
	return DC.currency + parseFloat(value).toFixed(2);
};
DC.message = function(html){
	$('#cart-message').stop(true, true).html(html).fadeIn(400).delay(800).fadeOut(400);
};