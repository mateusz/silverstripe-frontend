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

		/**
		 * Replace the original replacement with an append.
		 */
		_transitionContent: function(content) {
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
					// Create
					var newWidgetEl = $(
						'<div class="ss-pagination">'+
							'<a href="#" data-page-number="'+(currentPage+1)+'">More</a>'+
						'</div>'
					);
					this.widgetEl = newWidgetEl;
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
