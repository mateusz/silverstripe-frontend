# SilverStripe frontend

## Maintainer 

[Mateusz Uzdowski](mailto:mateusz@silverstripe.com)

## Requirements 

SilverStripe 3 (master)

## Changelog

Not released yet.

## Installation 

1. Include the module folder in your project root folder and rename it to "frontend"
1. Flush the manifest (?flush=1)

## Features

- provides a sspagination jQuery UI widget that acts as a drop-in replacement for regular pagination.
- provides a ssendless widget that adds a Twitter-style rollout pagination. 

# Components

## sspagination (jquery.ss.pagination.js)

The widget completely replaces a specified static pagination control with one written in JS. Page changes are handled internally here, without relying on the original markup. Variety of classes are available on the DOM elements for customisation. A couple of hooks have also been provided. 

For fetching the widget is using a poor man's PJAX - which means it fetches the entire page via AJAX, and then uses jQuery to pick up only the element that needs to be replaced. This could change in the future.

The widget relies on the pagination metadata to be passed on from the backend. The easiest way to achieve that is to use the `AjaPaginatedList` as a wrapper for the DataList.

```php
public function Pages() {
	return new AjaxPaginatedList(Page::get(), $this->request);
}
```

This provides you with an API call to generate a HTML5 data attributes containing the pagination metadata that the widget can automatically pick up. On the template side add it on the element containing the static pagination control. The optional attribute is the same as for the `PaginationSummary` - it specifies the amount of context to be shown around current page.

```html
<ul class="pagination" $Pages.PaginationMetadata(2)>
```

Apply the widget on the frontend by at minimum specifying the `contentSelector` option. This is a selector that will be used to find the content element to replace, and also to find the relevant piece of the content received via a regular AJAX call. Also specify the spinner (an indicator) that will automatically be shown when the pages are loading.

```js
$('ul.pagination').sspagination({
	contentSelector: '.pagination-content',
	indicatorElement: $('.pagination-indicator')
});
```

The dynamic pagination should be now running. You can invoke functions on the widget in the usual jQuery UI way:

```js
// This will invoke the page fetch, and refresh the pagination control.
$('ul.pagination').sspagination('setCurrentPage', 2);

// Hook into the sspagination events.
$('ul.pagination').bind('sspaginationafterpagefetch', function(event) {
	// Do processing.	
});

// This uses the item number instead (as opposed to the page), which is how the backend handles the pagination.
$('ul.pagination').sspagination({pageStart: 2});

// You can also dynamically change page size and the widget will refresh itself accordingly (this does not invoke a fetch).
$('ul.pagination').sspagination({pageLength: 1});

// Destroy the widget and revert to static navigation.
$('ul.pagination').sspagination('destroy');
```

### Options

tbd

* `contentSelector`
* `pageStart`
* `pageLength`
* `totalItems`
* `getParam`
* `context`
* `indicatorElement`

### Methods

tbd

* `getTotalPages`
* `getCurrentPage`
* `setCurrentPage`
* `destroy`

### Events

* `beforepagefetch`: before the AJAX call is made
* `afterpagefetch`: after a successful fetch & refresh (i.e. after the relevant afterrefresh)
* `beforerefresh`: before the widget is updated (removed and recreated to fit with the current options)
* `afterrefresh`: after the widget has been updated

## ssendless (jquery.ss.endless.js)

This widget extends the sspagination (both js files have to be included). It replaces the classical, skip-to-page, pagination with a endless rollout behaviour. Instead of removing the displayed page content it appends the consecutive page at the end, and removes itself from the way if there is no more pages to be displayed. 

The behaviour of dynamic changes to options is unspecified with this widget - i.e. it should be preconfigured on creation.

The widget usage is the same as sspagination:

```js
$('ul.pagination').ssendless({
	contentSelector: '.pagination-content',
	indicatorElement: $('.pagination-indicator')
});
```

# FAQ

Nothing yet.

# Dev notes

Nothing yet.
