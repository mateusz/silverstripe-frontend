# SilverStripe frontend

## tl;dr

Enable AJAX pagination in SilverStripe in three easy steps!

* Step 1: wrap your `DataList` with a list decorator:

	```php
	$pages = new AjaxPaginatedList(Page::get(), $this->request);
	```

* Step 2a: add pagination metadata markup into your template:

	```html
	<div class='pagination" $Pages.PaginationMetadata(2)>
	```

* Step 2b: prepare the target area for page content in the template:

	```html
	<div class='pagination-content'></div>
	```

* Step 3: apply the widget (assuming the requirements for the JavaScript libraries are met):

	```js
	$('div.pagination').sspagination({contentSelector: '.pagination-content'});
	```

Also, it's just as easy to apply an endless-style pagination (like Google images or Twitter have) - instead of a page
list you will get a more button and pages will be appended at the end, instead of replaced!

There might be more to come ;-) If you have an idea for things that would fit nicely into widgets, let me know!

## Maintainer

[Mateusz Uzdowski](mailto:mateusz@silverstripe.com)

## Requirements

* SilverStripe 3
* jQuery
* jQuery UI
* underscore.js (include `frontend/javascript/underscore.js`)
* lib.js (include `framework/admin/javascript/lib.js`)

## Changelog

### 0.2

* 3.1 support.
* Add PJAX support to AJAX fetches.
* Redirect to error page on AJAX HTTP failure.
* Integration with the document.location - add pushState support.
* Fix exception for missing lib.js.
* Added `docs/sspagination-how-to.md`.

### 0.1

* First release including sspagination and ssendless widgets.

## Installation

Add following line to your `composer.json` and run `composer update`:

	"mateusz/frontend": "*"
	
Note the package name has recently been changed from `silverstripe/frontend`, but both names should still work. The
former is preferred for future compatibility.

## Features

- provides an sspagination jQuery UI widget which acts as a drop-in replacement for regular pagination.
- provides an ssendless jQuery UI widget which adds a Twitter-style rollout pagination. 

# Components

## sspagination (jquery.ss.pagination.js)

The widget completely replaces a specified PHP-driven pagination control with a JS one. The original markup is hidden
and not used, and internal underscore templates are used instead. Variety of classes are available on the DOM elements
for customisation. A couple of hooks have also been provided. 

### Note on AJAX/PJAX

By default the widget is using a "poor man's PJAX" - which means it fetches the entire page via AJAX, and then uses
jQuery to pick up only the element that needs to be replaced. This is perfect in two situations:

* A quick job that doesn't involve modifying a lot of PHP code.
* Using static publisher for fetching pre-rendered HTML content.

The downside for the dynamic scenario is that we are rendering entire pages which is slower as we are invoking entire
stack.

If the speed (or server load) is of concern, it's easy to enable PJAX fetching. PJAX will ensure just the required
snippet is rendered and server via JSON. See the [PJAX how-to](docs/pjax-how-to.md) for details.

### Pulling in the requirements

jQuery and jQuery UI are required for this widget to run. This module does not supply these, usually you'd like to
be able to choose your own version of jQuery so loading of these is up to you. However the two other requirements
are provided by Framework and by the module, so you can just copy and paste these.

Here is an example how this could be done via `Requirements` API in your `Controller`:

```php
public function init() {
	parent::init();

	// First, load jQuery - don't forget to update the paths!
	Requirements::javascript('<your-script-path>/jquery-2.0.0.js');
	Requirements::javascript('<your-script-path>//jquery-ui-1.10.3.custom.js');

	// Second, load scripts for this module - order os important.
	Requirements::javascript('framework/admin/javascript/lib.js');
	Requirements::javascript('frontend/javascript/underscore.js');
	Requirements::javascript('frontend/javascript/jquery.ss.pagination.js');
	Requirements::javascript('frontend/javascript/jquery.ss.endless.js'); // choose one or both.

	// Finally, pull in your custom code.
	Requirements::javascript('<your-script-path>/your-script.js');
}
```

### Including pagination metadata

The widget relies on the pagination metadata to be supplied during creation. This can be done via normal jQuery UI
option mechanism, but the easiest way to achieve that is to use the `AjaPaginatedList` as a wrapper for the DataList.

```php
public function Pages() {
	return new AjaxPaginatedList(Page::get(), $this->request);
}
```

This provides you with an API call to generate HTML5 data attributes containing the pagination metadata that the widget
can automatically pick up. On the template side add it to the element containing the [static pagination
control](http://doc.silverstripe.org/framework/en/howto/pagination). The optional attribute is the same as for the
`PaginationSummary` - it specifies the amount of context to be shown around current page.

```html
<div class="pagination" $Pages.PaginationMetadata(2)>
	// Static pagination follows.
</div>
```

It doesn't matter what is the structure of the static pagination markup. The widget will completely replace it using
it's own format for the pagination, based on the data attributes provided via the `Pages.PaginationMetadata` (the format
can be changed - see "Template customisation" below). The static pagination is included as a fallback mechanism for non
JS enabled clients.

A more comprehensive example of usage can be found in the [sspagination how-to](docs/sspagination-how-to.md).

### Applying and configuring the widget

Apply the widget on the frontend by at minimum specifying the `contentSelector` option. This is a selector that will be
used to find the content element to replace, and also to find the relevant piece of the content received via a regular
AJAX call. Also specify the spinner (an indicator) that will automatically be shown when the pages are loading. You
should add this indicator element yourself, and hide it with CSS, so it doesn't appear if JS is broken/disabled.

```js
$('div.pagination').sspagination({
	contentSelector: '.pagination-content',
	indicatorElement: $('.pagination-indicator')
});
```

The dynamic pagination should now be running.

You can invoke functions on the widget in the usual jQuery UI way:

```js
// This will invoke the page fetch, and refresh the pagination control.
$('div.pagination').sspagination('setCurrentPage', 2);

// Hook into the sspagination events.
$('div.pagination').bind('sspaginationafterpagefetch', function(event) {
	// Do processing.
});

// This uses the item number instead (as opposed to the page), which is how the backend handles the pagination.
$('div.pagination').sspagination({pageStart: 2});

// You can also dynamically change page size and the widget will refresh itself accordingly (this does not invoke a fetch).
$('div.pagination').sspagination({pageLength: 1});

// Destroy the widget and revert to static navigation.
$('div.pagination').sspagination('destroy');
```

### Template customisation

The widget DOM is built up from parametrised underscore.js templates. You can redefine them to get a custom layout.
One thing to keep in mind is that you can't update just one template using the jQuery widget API - the whole object
will get replaced, so make sure all templates are provided. You can customise them on initialisation, or later:

```js
	$('div.pagination').sspagination({
		templates: {
			// All templates need to be provided here
			// ...
		}
	});
```

A way to get around the verbosity if you want to update just a single template is to extract the option out like this:

```js
	// Extract the templates
	var templates = $('div.pagination').sspagination('option', 'templates');
	// Update just one.
	templates.main = '<div class="extra-div"><ul class="ss-pagination"><%= inside %></ul></div>';
	// You need to reset it to trigger a refresh, otherwise the template will not update immediately.
	$('div.pagination').sspagination({templates: templates});
```

To see all available templates for a widget and their default values, have a look at the top of the relevant source
file. More information on working with underscore templates can be found in [underscore
docs](http://underscorejs.org/#template).

### Options

* `contentSelector`
* `pageStart`
* `pageLength`
* `totalItems`
* `getParam`
* `context`
* `indicatorElement`

### Methods

* `getTotalPages`
* `getCurrentPage`
* `setCurrentPage`
* `destroy`

### Events

* `beforepagefetch`: before the AJAX call is made. Return false to prevent fetching.
* `afterpagefetch`: after a successful fetch & refresh (i.e. after the relevant afterrefresh)
* `beforerefresh`: before the widget is updated (removed and recreated to fit with the current options). Return false to
prevent refreshing.
* `afterrefresh`: after the widget has been updated.
* `ontransition`: called just before the pagination-content element is about to be manipulated. Return false to prevent
default behaviour.

## ssendless (jquery.ss.endless.js)

This widget extends the sspagination (both js files have to be included). It replaces the classical, skip-to-page,
pagination with a endless rollout behaviour. Instead of removing the displayed page content it appends the consecutive
page at the end, and removes itself from the way if there is no more pages to be displayed.

The behaviour of dynamic changes to options is unspecified with this widget - i.e. it should be preconfigured on
creation.

The widget usage is similar to sspagination:

```js
$('div.pagination').ssendless({
	contentSelector: '.pagination-content',
	indicatorElement: $('.pagination-indicator')
});
```

# FAQ

Nothing yet.

# Dev notes

* template parametrisation currently works on creation only. This is because setting deeply nested options replaces the
exisiting structures.

