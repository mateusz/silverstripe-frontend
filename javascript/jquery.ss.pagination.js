(function($) {
	var sspaginationUIDTracker = 0;

	$.widget("ss.sspagination", {

		options: {
			contentSelector: null,
			pageStart: null,
			pageLength: null,
			totalItems: null,
			getParam: null,
			context: null,
			indicatorElement: null,
			transitionMethod: 'replace'
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

			// Config validation
			if (this.options.pageStart===null) throw "ss.pagination error: pageStart not set";
			if (this.options.pageLength===null) throw "ss.pagination error: pageLength not set";
			if (this.options.totalItems===null) throw "ss.pagination error: totalItems not set";
			if (this.options.getParam===null) throw "ss.pagination error: getParam not set";
			if (this.options.context===null) throw "ss.pagination error: context not set";

			// Set the uid for use with specific elements.
			this.uid = 'sspagination'+sspaginationUIDTracker++;

			// Get the content via selector.
			this.contentElement = $(this.options.contentSelector);
			if (!this.options.contentSelector || !this.contentElement.length) throw "ss.pagination error: content element not found - invalid contentSelector?";

			// Initialise the DOM.
			this.element.hide();
			this._refresh();
			this._bindAll();
		},

		/**
		 * Fetch new page from the server.
		 * We are only interested in the content element, so we peel the rest
		 * off via the contentSelector.
		 */
		_fetch: function(pageStart) {
			var self = this;

			if (this._trigger('beforepagefetch')===false) return;

			if (this.options.indicatorElement!==null) {
				this.options.indicatorElement.show();
			}

			$.get(document.location+'?'+this.options.getParam+'='+pageStart, function(data) {
				self.contentElement.html($(data).find(self.options.contentSelector).html());

				if (self.options.indicatorElement!==null) {
					self.options.indicatorElement.hide();
				}

				self._refresh();
				self._bindAll();

				self._trigger('afterpagefetch');
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
					// Show first, last, and in-range pages.
					if (pageNumber===currentPage) {
						pagesPart += '<li class="ss-pagination-page ss-pagination-current">'+pageNumber+'</li>';
					}
					else {
						pagesPart += '<li class="ss-pagination-page ss-pagination-active"><a href="#" data-page-number="'+pageNumber+'">'+pageNumber+'</a></li>';
					}
					// Reset the ellipsis tracker.
					abbrevShown = false;
				}
				else {
					// Show the abbreviation (...), but only once per empty block.
					if (!abbrevShown) {
						pagesPart += '<li class="ss-pagination-abbrev">...</li>';
						abbrevShown = true;
					}
				}
			}

			// Build prev/next parts.
			var prevPart;
			if (currentPage!==1) {
				prevPart = '<li class="ss-pagination-prev ss-pagination-active"><a href="#" data-page-number="'+(currentPage-1)+'"">Previous</a></li>';
			}
			else {
				prevPart = '<li class="ss-pagination-prev">Previous</li>';
			}
			var nextPart;
			if (currentPage!==totalPages) {
				nextPart = '<li class="ss-pagination-next ss-pagination-active"><a href="#" data-page-number="'+(currentPage+1)+'">Next</a></li>';
			}
			else {
				nextPart = '<li class="ss-pagination-next">Next</li>';
			}

			// Replace the existing widget/static pagination.
			var newWidgetEl = $(
				'<ul class="ss-pagination">'+
					prevPart+
					pagesPart+
					nextPart+
				'</ul>');

			if (typeof this.widgetEl!=='undefined') {
				this.widgetEl.unbind('.'+this.uid).remove();
			}
			this.widgetEl = newWidgetEl;
			this.element.after(this.widgetEl);

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
			switch(key) {
				// Trigger new refresh of the pagination control on size changes.
				case 'pageStart':
					this.options[key] = parseInt(value);
					this._fetch(value);
					break;
				case 'pageLength':
				case 'totalItems':
				case 'context':
					this.options[key] = parseInt(value);
					this._refresh();
					this._bindAll();
					break;

				case 'contentSelector':
					this.options[key] = parseInt(value);
					this.contentElement = $(this.options.contentSelector);
					break;
			}
			$.Widget.prototype._setOption.apply(this,arguments);
		},

		/**
		 * Clean the entire widget up. Should restore initial state.
		 */
		destroy: function() {
			this._unbindAll();
			this.widgetEl.remove();
			this.element.show();

			$.Widget.prototype.destroy.call(this);
		}
	});
})(jQuery);
