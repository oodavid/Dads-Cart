DC = {};

/***************** Dads Cart! ******************/

DC.currency = '&pound;';
DC.init = function(e){
	// Activate the cart-add and cart-remove buttons
	$('.cart-add').on('click', DC.add);
	$('.cart-remove').on('click', DC.remove);
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

/************** Add, Remove, Empty **************/

DC.add = function(e){
	// Pull out the cart-data
	var cart = DC.get();
	// Reference the cart item
	var item = $(this).closest('.cart-item, .cart-review-item');
	// It must exist and have an ID
	if(!item.length || !item.attr('data-uid')){
		DC.message('unable to add this item');
		return;
	}
	// Find all the properties of the item
	var properties = item.find("[class^=cart-p-], [class*= cart-p-]");
	// Build them into a proper data object
	var itemdata = {};
	var regex = /(^|\s)cart-p-(.*)/i;
	$.each(properties, function(k,v){
		// The value is either an :input val or html contents
		var value = $(this).val() || $(this).html();
		// The key can be derived from the class
		var klass = $(this).attr('class');
		var tmp = klass.match(regex);
		// We good?
		if(tmp){
			itemdata[tmp[2]] = value;
		}
	});
	// Add the uid and the current url
	itemdata.uid	= item.attr('data-uid');
	itemdata.href	= location.href;
	// qty defaults to 1, price to 0
	itemdata.qty	= parseFloat(itemdata.qty)		|| 1;
	itemdata.price	= parseFloat(itemdata.price)	|| 0;
	// Do we already have an item with that uid?
	if(cart[itemdata.uid]){
		// Update the qty
		itemdata.qty += cart[itemdata.uid].qty;
	}
	// Set the item
	cart[itemdata.uid] = itemdata;
	// Store the cart-data
	var cart = $.jStorage.set('dads-cart', cart);
	// Show a message
	DC.message('item added to cart');
	// Refresh the interface
	DC.refresh();
	// If the review is open, we dont want to close it
	e.stopPropagation();
};
DC.remove = function(e){
	// Pull out the cart-data
	var cart = DC.get();
	// Reference the cart item
	var item = $(this).closest('.cart-item, .cart-review-item');
	// It must exist and have an ID
	if(!item.length || !item.attr('data-uid')){
		DC.message('unable to remove this item');
		return;
	}
	// Remove the item
	delete cart[item.attr('data-uid')];
	// Store the cart-data
	var cart = $.jStorage.set('dads-cart', cart);
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
	// Build the products listing...
	$('#cart-review-items').empty();
	$.each(cart, function(k,v){
		// Do we have $.tmpl?
		if($.tmpl){
			// Use $.tmpl
			debugger
			var item = $('#cart-review-item-template').tmpl(v);
		} else {
			// Pull out the template contents
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
		}
		// Set the uid
		item.attr('data-uid', k);
		// Add the events (for some reason $.on doesnt catch this)
		item.find('.cart-add').click(DC.add);
		item.find('.cart-remove').click(DC.remove);
		// Add it
		$('#cart-review-items').append(item);
	});
};

/****************** Utilities *******************/

DC.toMoney = function(value){
	// Returns a currency-formatted number
	return DC.currency + parseFloat(value).toFixed(2);
};
DC.message = function(html){
	$('#cart-message').stop(true, true).html(html).fadeIn(400).delay(800).fadeOut(400);
};