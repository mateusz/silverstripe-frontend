# Sspagination how-to

Here is a more comprehensive example of using sspagination - we assume we are attempting  to list all pages available on
the site, paginated in the chunks of 5.

First of all, we need to provide the data - this is a job for the backend code. Here is an example of how `Page.php`
might look like:

```php
<?php

class Page extends SiteTree {
	public function PaginatedPages() {

		// By default sspagination uses 'start' GET parameter to select the page.
		// This is the same as the default SilverStripe installation.
		$start = isset($_GET['start']) ? (int) $_GET['start'] : 0;

		// The wrapper provides data attributes to the template taken from the DataQuery.
		$paginatedList = new AjaxPaginatedList(Page::get());

		// We need to set some options so the data attributes can be set.
		$paginatedList->setPageLength(5);
		$paginatedList->setPageStart($start);

		return $paginatedList;
	}
}

class Page_Controller extends ContentController {

}
```

Now we can build the template - I assume the base template has already been built, so we will just add a specialised
layout. This is mostly copied from the [original SilverStripe pagination
example](http://doc.silverstripe.org/framework/en/trunk/howto/pagination).

```html
<!-- Here is our listing of the site's pages. -->
<div class="pagination-content">
	<ul>
		<% loop PaginatedPages %>
			<li><a href="$Link">$Title</a></li>
		<% end_loop %>
	</ul>
</div>

<!-- We can add in the indicator for good measure (don't forget to hide it via CSS!) -->
<img class='pagination-indicator' alt="Loading" src="themes/mytheme/images/ajax-loader.gif">

<!-- And here is the pagination control itself. -->
<!-- The only addition here is PaginationMetadata addition. -->
<div class="pagination" $PaginatedPages.PaginationMetadata(2)>
	<% if PaginatedPages.MoreThanOnePage %>
		<% if PaginatedPages.NotFirstPage %>
			<a class="prev" href="$PaginatedPages.PrevLink">Prev</a>
		<% end_if %>
		<% loop PaginatedPages.Pages %>
			<% if CurrentBool %>
				$PageNum
			<% else %>
				<% if Link %>
					<a href="$Link">$PageNum</a>
				<% else %>
					...
				<% end_if %>
			<% end_if %>
			<% end_loop %>
		<% if PaginatedPages.NotLastPage %>
			<a class="next" href="$PaginatedPages.NextLink">Next</a>
		<% end_if %>
	<% end_if %>
</div>
```

The most important part here from the perspective of sspagination is the `$PaginatedPages.PaginationMetadata`. Here is
how the output for this specific example will look like for `div.pagination`:

```html
<div class="pagination"
	data-page-start="5"
	data-page-length="5"
	data-total-items="52"
	data-get-param="start"
	data-context="2">
```

Notice all the parameters have been added that are required to build the pagination control. Some of them are generated
automatically, like `data-total-items`. Some others need to be manually set, like for example `data-page-length` (this
is adjusted in the following line in the `Page.php`: `$paginatedList->setPageLength(5);` (see above).

Until now all we have built is a regular pagination that works without AJAX, very similar to the default SilverStripe
pagination.

Let's assume that you have included jQuery already in your `<header>`, and also included the sspagination script in the
header of the page like this:

```html
<script type="text/javascript" src="frontend/javascript/jquery.ss.pagination.js"></script>
```

To apply sspagination, add the following script to be executed with your page:

```js
$('.pagination').sspagination({
	indicatorElement: $('.pagination-indicator'),
	contentSelector: '.pagination-content'
});
```

That's it. This will replace the `.pagination` element with the widget-generated markup. When you attempt to change the
pagination page the widget will update itself, show the `.pagination-indicator`, and fetch the current URL using the
`?start=` GET parameter to select the required page. It will then parse the response by looking for
`.pagination-content` and substitute the existing content. Finally it will hide the progress indicator.

One current caveat is the response is being delivered as a full page render - and then the appropriate content is
cherry-picked. This is not very efficient, but is the only behaviour available at the moment- adding PJAX should sort
this out ([issue on GitHub](https://github.com/mateusz/silverstripe-frontend/issues/7)).
