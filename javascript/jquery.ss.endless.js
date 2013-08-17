/**
 * Drop-in replacement for a SilverStripe pagination control.
 * Provides a "more" button that keeps rolling out the list via AJAX.
 *
 * Note: on-the-fly changes to options can cause weird behaviour,
 * as this widget is expecting to roll out pages consecutively and
 * then remove itself out of the picture.
 */

(function($) {

	$.widget("ss.ssendless", $.ss.sspagination, {

		options: {
			templates: {
				main:
					'<div class="ss-pagination">'+
						'<a href="#" data-page-number="<%= nextPage %>">More</a>'+
					'</div>'
			}
		},

		/**
		 * Do nothing on popstate.
		 */
		_onPopstate: function(evt) {
			return false;
		},

		/**
		 * Do not push state.
		 */
		_onPushstate: function(url, fromPopstate) {
			return false;
		},

		/**
		 * Append instead of replace. Do not add a history state - not meaningful in this case.
		 */
		_transition: function(pageStart, content) {
			this.contentElement.append(content);
		},

		/**
		 * Build the more button and update it according to the current state.
		 */
		_refresh: function() {
			if (this._trigger('beforerefresh')===false) return;

			// Get the derived variables.
			var currentPage = this.getCurrentPage();
			var totalPages = this.getTotalPages();

			if (currentPage<totalPages) {
				// Widget should be present.
				if (typeof this.widgetEl==='undefined') {
					// Create from template.
					this.widgetEl = $(_.template(
						this.options.templates.main, 
						{nextPage: currentPage+1}
					));
					this.element.after(this.widgetEl);
					this._bindAll();
				}
				else {
					// Reconfigure to fetch the consecutive page. We don't need to recreate the button.
					this.widgetEl.find('a').attr('data-page-number', currentPage+1).data('page-number', currentPage+1);
				}
			}
			else {
				// We have ran out of pages - remove.
				if (typeof this.widgetEl!=='undefined') {
					this._unbindAll();
					this.widgetEl.remove();
				}
			}

			this._trigger('afterrefresh');
		}

	});
})(jQuery);
