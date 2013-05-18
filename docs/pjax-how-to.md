# PJAX How-to

PJAX is a HTTP protocol extension for fetching just the selected snippets of content via JSON. It speeds up the
rendering process and reduces server load by not attempting to render entire pages. This can be enabled by some
modifications to the controller PHP code which we will step through here.

## Technical background

This information is not really required to enable PJAX operation, but gives some insight into how PJAX operates.

On the request side, the widget will automatically include a `X-Pjax` header that signals to the backend which snippet
should be rendered. This header is configurable via `AjaxPaginatedList` API.

On the response side, the server backend inspects the PJAX header, and uses Framework's own `PjaxResponseNegotiator` to
route the request. If the PJAX header is missing (i.e. PJAX disabled, or a regular HTTP request) the full page is
rendered as normal. If it is found, just the requested part of content is rendered and provided as JSON. One negotiator
can serve any amount of PJAX snippets, plus the default.

This is also how the CMS is communicating with the backend.

## Enabling PJAX

Let's build this how-to on top of the outcome of the [Sspagination how-to](../docs/sspagination-how-to.md).

First of all we need to enable PJAX fetching on the frontend by reconfiguring `AjaxPaginatedList`. In
`Page::PaginatedPages` add the following function call:

```php
$paginatedList->setPjaxHeader('PagePagination');
```

This will cause the backend to include additional data attribute in the usual set provided by the `PaginationMetadata`.
The frontend widget will notice that, and start making PJAX requests using the configured header instead of regular HTTP
requests.

Next, we need to make sure backend knows how to handle PJAX requests. Let's override the default handling of requests
with `PjaxResponseNegotiator` - just for regular HTTP requests for now.

```php
class Page_Controller extends ContentController {

	private static $allowed_actions = array (
		'index'
	);

	/**
	 * Override default handler.
	 */
	public function index($request) {
		$controller = $this;

		$responseNegotiator = new PjaxResponseNegotiator(
			array(
				'default' => function() use(&$controller) {
					return $controller->render();
				}
			),
			$this->response
		);

		return $responseNegotiator->respond($request);
	}
```

You can check if the page is loading correctly - the full page load will fall under the 'default' case above, and go
through the normal `Controller::render` routine.

However if we try to change the page on our listing (via AJAX), we will receive an error: `X-Pjax = 'PagePagination' not
supported for this URL.` This means the `PjaxResponseNegotiator` did not recognise the PJAX fragment requested. Let's
add it in:

```php
	...
	$responseNegotiator = new PjaxResponseNegotiator(
		array(
			'PagePagination' => function() use(&$controller) {
				return $controller->renderWith('Page_Pagination');
			},
			'default' => function() use(&$controller) {
				return $controller->render();
			}
		),
		$this->response
	);
	...
```

Now when asked for PJAX fragment named 'PagePagination' the controller will attempt to render a 'Page_Pagination'
template. This will fail, because we have no such template ready (any other template name could be used though - the
name is not magical. `PjaxResponseNegotiator` might just as well return a static text snippet).

This template can be created by extracting the page content part from the original template. In this example we'd
replace the original template's `pagination-content` div with something like this:

```html
...
<div class="pagination-content">
	<%-- This include is reused for serving via PJAX --%>
	<% include Page_Pagination %>
</div>
...
```

Then we'd drop this content into `Includes/Page_Pagination.ss`:

```html
	<ul>
		<% loop PaginatedPages %>
			<li><a href="$Link">$Title</a></li>
		<% end_loop %>
	</ul>
```

By setting the includes up in this way we are reusing the same code for the full-page render (via include in the
original template) and for the PJAX serving (by rendering the `Page_Pagination.ss` template directly). This should
simplify the future maintenance of the templates.

If you test your page now, you should see the pages are loading slightly faster. If you preview the HTTP traffic, you
should see the requests are now including `X-PJAX=PagePagination` headers, and the responses are
`Content-Type=text/json`.

