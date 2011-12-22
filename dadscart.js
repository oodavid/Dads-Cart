DC = {};

/***************** Dad's Cart! ******************/

DC.currency = '£';
DC.init = function(e){
	// Pull out the currency if we can
	DC.currency = $('#cart-link').attr('data-currency') || DC.currency;
	// Activate the cart-add and cart-remove buttons
	// $('.cart-add').click(DC.add);
	// $('.cart-remove').click(DC.remove);
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
		DC.message('couldn\'t add item to cart');
		return;
	}
	// Find all the "properties" of the item
	var properties = item.find("[class^='cart-'], [class*=' cart-']");
	// Build them into a proper data object
	var itemdata = {};
	var regex = /(^|\s)cart\-(.*)/i;
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
	// It must have a price
	if(!itemdata.price){
		DC.message('couldn\'t add item to cart');
		return;
	}
	// Add the uid and the current url
	itemdata.uid	= item.attr('data-uid');
	itemdata.href	= location.href;
	// If we don't have a qty, set it to 1
	itemdata.qty = itemdata.qty ? parseFloat(itemdata.qty) : 1;
	// We must have a floated price
	itemdata.price = parseFloat(itemdata.price);
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
	// If the review is open, we don't want to close it
	e.stopPropagation();
};
DC.remove = function(e){
	// Pull out the cart-data
	var cart = DC.get();
	// Reference the cart item
	var item = $(this).closest('.cart-item, .cart-review-item');
	// It must exist and have an ID
	if(!item.length || !item.attr('data-uid')){
		DC.message('couldn\'t remove this item');
		return;
	}
	// Remove the item
	delete cart[item.attr('data-uid')];
	// Store the cart-data
	var cart = $.jStorage.set('dads-cart', cart);
	// Refresh the interface
	DC.refresh();
	// If the review is open, we don't want to close it
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
	var totals = { products: 0, items: 0, price: 0 };
	$.each(cart, function(k,v){
		totals.products ++;
		totals.items += v.qty;
		totals.price += v.qty * v.price;
	});
	// Write em
	$('.cart-total-products').html(totals.products);
	$('.cart-total-items').html(totals.items);
	$('.cart-total-price').html(DC.toMoney(totals.price));
	// Build the products listing...
	$('#cart-review-items').empty();
	$.each(cart, function(k,v){
		// Pull out the template
		var tmpl = $('#cart-review-item').html();
		// Loop all the properties and replace the placeholders
		$.each(v, function(k2,v2){
			var regex = new RegExp('{{' + k2 + '}}', "gi");
			tmpl = tmpl.replace(regex, v2);
		});
		// Set the uid
		tmpl = $(tmpl);
		tmpl.attr('data-uid', k);
		// Add the events (for some reason "on" doesn't catch this)
		tmpl.find('.cart-add').click(DC.add);
		tmpl.find('.cart-remove').click(DC.remove);
		// Add it
		$('#cart-review-items').append(tmpl);
	});
};

/****************** Utilities *******************/

DC.toMoney = function(number){
	// Returns a currency-formatted number
	return DC.currency + number.toFixed(2);
};
DC.message = function(html){
	$('#cart-message').html(html).fadeIn(400).delay(800).fadeOut(400);
};