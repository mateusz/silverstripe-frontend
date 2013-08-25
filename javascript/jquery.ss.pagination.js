/**
 * Drop-in replacement for a SilverStripe pagination control.
 * Provides a dynamic JS AJAX pagination control.
 */

(function($) {
	var sspaginationUIDTracker = 0;

	$.widget("ss.sspagination", {

		options: {
			contentSelector: null,
			pageStart: null,
			pageLength: null,
			totalItems: null,
			getParam: null,
			pjaxHeader: null,
			context: null,
			indicatorElement: null,
			transitionMethod: 'replace',
			templates: {
				main:
					'<ul class="ss-pagination"><%= inside %></ul>',
				prev:
					'<% if (active) { %>'+
						'<li class="ss-pagination-prev ss-pagination-active"><a href="#" data-page-number="<%= page %>"">Previous</a></li>'+
					'<% } else { %>'+
						'<li class="ss-pagination-prev">Previous</li>'+
					'<% } %>',
				next:
					'<% if (active) { %>'+
						'<li class="ss-pagination-next ss-pagination-active"><a href="#" data-page-number="<%= page %>">Next</a></li>'+
					'<% } else { %>'+
						'<li class="ss-pagination-next">Next</li>'+
					'<% } %>',
				page:
					'<% if (current) { %>'+
						'<li class="ss-pagination-page ss-pagination-current"><%= page %></li>'+
					'<% } else { %>'+
						'<li class="ss-pagination-page ss-pagination-active"><a href="#" data-page-number="<%= page %>"><%= page %></a></li>'+
					'<% } %>',
				abbrev:
					'<li class="ss-pagination-abbrev">…</li>'
			}
		},

		/**
		 * Computes the total number of pages from the fundamental params.
		 */
		getTotalPages: function() {
			return Math.ceil(this.options.totalItems/this.options.pageLength);
		},

		/**
		 * Computes current page from the fundamental params.
		 */
		getCurrentPage: function() {
			return Math.floor(this.options.pageStart/this.options.pageLength)+1;
		},

		/**
		 * Sets the fundamental params to reflect the requested page number.
		 */
		setCurrentPage: function(pageNumber) {
			this._setOption('pageStart', (pageNumber-1)*this.options.pageLength);
		},

		/**
		 * Replace the static control, bind events.
		 */
		_create: function() {
			// Check if the backend passes us the metadata.
			if (this.options.pageStart===null) this.options.pageStart = this.element.data('page-start');
			if (this.options.pageLength===null) this.options.pageLength = this.element.data('page-length');
			if (this.options.totalItems===null) this.options.totalItems = this.element.data('total-items');
			if (this.options.getParam===null) this.options.getParam = this.element.data('get-param');
			if (this.options.context===null) this.options.context = this.element.data('context');

			if (this.options.pjaxHeader===null && this.element.data('pjax-header')) {
				this.options.pjaxHeader = this.element.data('pjax-header');
			}

			// Config validation
			if (this.options.pageStart===null) throw "ss.pagination error: pageStart not set";
			if (this.options.pageLength===null) throw "ss.pagination error: pageLength not set";
			if (this.options.totalItems===null) throw "ss.pagination error: totalItems not set";
			if (this.options.getParam===null) throw "ss.pagination error: getParam not set";
			if (this.options.context===null) throw "ss.pagination error: context not set";

			// Set the uid for use with specific elements.
			this.uid = 'sspagination'+sspaginationUIDTracker++;

			// Install popstate
			if (typeof window.history!=='undefined') {
				$(window).on("popstate.sspagination", {self: this}, this._onPopstate);
			}

			// Get the content via selector.
			this.contentElement = $(this.options.contentSelector);
			if (!this.options.contentSelector || !this.contentElement.length) throw "ss.pagination error: content element not found - invalid contentSelector?";

			// Hide loading indicator.
			if (this.options.indicatorElement!==null) {
				this.options.indicatorElement.hide();
			}

			// Initialise the DOM.
			this.element.hide();
			this._refresh();
		},

		/**
		 * React to HTML5 history transition.
		 */
		_onPopstate: function(evt) {
			var self = evt.data.self;

			// Call the _fetch directly so we can let it know this is a popstate.
			var pageStart = self._getPageStartFromUrl.apply(self);
			self.options.pageStart = pageStart;
			self._fetch(pageStart, true);
		},

		/**
		 * React to internal pushstate.
		 */
		_onPushstate: function(url, fromPopstate) {
			// Add history state only if navigating to a new page.
			if (!fromPopstate) {
				if (typeof window.history!=='undefined' && typeof window.history.pushState!=='undefined') {
					window.history.pushState('', '', url);
				}
			}
		},

		/**
		 * Perform page switch operation. The new content is represented by the "url".
		 */
		_transition: function(pageStart, content) {
			this.contentElement.html(content);
		},

		/**
		 * Helper to extract the current page start from the url.
		 */
		_getPageStartFromUrl: function() {
			if (typeof $.path==='undefined' || typeof $.path.parseUrl==='undefined') {
				throw "ss.pagination error: please include framework/admin/javascript/lib.js";
			}

			var parsedUrl = $.path.parseUrl(document.location.href),
				search = parsedUrl.search || "?",
				// Match against URL page start parameter.
				re = new RegExp('[\?&]'+this.options.getParam+'=([^&#]*)');

			var match = search.match(re);
			if (match!==null && typeof match[1]!=='undefined') {
				return parseInt(match[1]);
			} else {
				return 0;
			}
		},

		/**
		 * Generate the URL from the existing document.location. Replace or inject getParam as needed.
		 */
		_createNewUrl: function(pageStart) {
			if (typeof $.path==='undefined' || typeof $.path.parseUrl==='undefined') {
				throw "ss.pagination error: please include framework/admin/javascript/lib.js";
			}

			var parsedUrl = $.path.parseUrl(document.location.href),
				search = parsedUrl.search || "?",
				// Match against URL page start parameter.
				re = new RegExp('([\?&]'+this.options.getParam+')=[^&#]*');

			if (search.match(re)) {
				// Replace existing string.
				search = search.replace(re, "$1=" + pageStart);
				return parsedUrl.hrefNoSearch + search + (parsedUrl.hash || "");
			} else {
				// Append.
				return parsedUrl.hrefNoSearch + search + (search.charAt(search.length-1) !== "?" ? "&" : "" ) +
					this.options.getParam + "=" + pageStart + (parsedUrl.hash || "");
			}
		},

		/**
		 * Fetch new page from the server.
		 * We are only interested in the content element, so we peel the rest
		 * off via the contentSelector.
		 */
		_fetch: function(pageStart, fromPopstate) {
			var self = this;
			fromPopstate = typeof fromPopstate!=='undefined' ? fromPopstate : false;

			if (this._trigger('beforepagefetch')===false) return;

			if (this.options.indicatorElement!==null) {
				this.options.indicatorElement.show();
			}

			var url = this._createNewUrl(pageStart);
			$.ajax({
				headers: {"X-Pjax" : this.options.pjaxHeader},
				url: url,
				success: function(data) {
					if (self._trigger('ontransition', data)!==false) {

						if (self.options.pjaxHeader!==null) {
							// PJAX enabled - content snippet supplied directly as JSON.
							var snippet = data[self.options.pjaxHeader];
						} else {
							// Entire page has been provided. Find the relevant DOM content for substitution.
							var snippet = $(data).find(self.options.contentSelector).html();
						}

						self._transition(pageStart, snippet);
						self._onPushstate(url, fromPopstate);
					}

					if (self.options.indicatorElement!==null) {
						self.options.indicatorElement.hide();
					}

					self._refresh();

					self._trigger('afterpagefetch');
				},
				error: function(data) {
					// Redirect to failing page so the full error can be shown.
					document.location.href = url;
				}
			});
		},

		/**
		 * Make sure the displayed pagination control matches the options.
		 */
		_refresh: function() {
			if (this._trigger('beforerefresh')===false) return;

			// Get the derived variables.
			var currentPage = this.getCurrentPage();
			var totalPages = this.getTotalPages();

			// Compute the range that should be included around the current page.
			var halfContext = Math.floor(this.options.context / 2);
			var rangeLeft = currentPage-halfContext;
			var rangeRight = currentPage+halfContext;
			
			// Build the pages part.
			var pageNumber;
			var abbrevShown = false;
			var pagesPart = '';
			for (pageNumber = 1; pageNumber<=totalPages; pageNumber++) {
				if (pageNumber==1 || (pageNumber>=rangeLeft && pageNumber<=rangeRight) || pageNumber===totalPages) {
					// Process first, last, and in-range pages.
					pagesPart += _.template(this.options.templates.page, {page: pageNumber, current: pageNumber===currentPage});

					// Reset the ellipsis tracker.
					abbrevShown = false;
				}
				else {
					// Show the abbreviation (...), but only once per empty block.
					if (!abbrevShown) {
						pagesPart += _.template(this.options.templates.abbrev, {});
						abbrevShown = true;
					}
				}
			}

			// Build prev/next parts.
			var prevPart = _.template(this.options.templates.prev, {page: currentPage-1, active: currentPage!==1});
			var nextPart = _.template(this.options.templates.next, {page: currentPage+1, active: currentPage!==totalPages});

			// Replace the existing widget/static pagination with the content built on top of the main template:
			var newWidgetEl = $(
				_.template(this.options.templates.main, {
					inside: prevPart+pagesPart+nextPart
				})
			);

			if (typeof this.widgetEl!=='undefined') {
				this._unbindAll();
				this.widgetEl.remove();
			}
			this.widgetEl = newWidgetEl;
			this.element.after(this.widgetEl);
			this._bindAll();

			this._trigger('afterrefresh');
		},

		/**
		 * Make sure the events are bound to the pagination control.
		 */
		_bindAll: function() {
			var self = this;

			// Page change event.
			this.widgetEl.find('a').bind('click.'+this.uid, function() {
				var pageNumber = parseInt($(this).data('page-number'));
				self.setCurrentPage(pageNumber);

				return false;
			});
		},

		/**
		 * Make sure the events are bound to the pagination control.
		 */
		_unbindAll: function() {
			if (typeof this.widgetEl!=='undefined') {
				this.widgetEl.unbind('.'+this.uid);
			}
		},

		/**
		 * Dynamically react to option changes.
		 */
		_setOption: function(key, value) {
			$.Widget.prototype._setOption.apply(this, arguments);

			switch(key) {
				// Trigger new refresh of the pagination control on size changes.
				case 'pageStart':
					this._fetch(value);
					break;
				case 'pageLength':
				case 'totalItems':
				case 'context':
				case 'templates':
					this._refresh();
					break;

				case 'contentSelector':
					this.contentElement = $(this.options.contentSelector);
					break;
			}
		},

		/**
		 * Clean the entire widget up. Should restore initial state.
		 */
		destroy: function() {
			this._unbindAll();
			this.widgetEl.remove();
			this.element.show();

			$(window).unbind(".sspagination");

			$.Widget.prototype.destroy.call(this);
		}
	});
})(jQuery);
