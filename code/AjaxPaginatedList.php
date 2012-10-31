<?php
/**
 * Adds support for frontend pagination.
 */

class AjaxPaginatedList extends PaginatedList {
	/**
	 * Generate metadata elements.
	 *
	 * @param int $context As in PaginatedList::PaginationSummary, how many pages 
	 * 				are to be displayed around the currently active page.
	 */
	function PaginationMetadata($context = null) {
		$meta = 
			'data-page-start="'.(int)$this->getPageStart().'" '.
			'data-page-length="'.(int)$this->getPageLength().'" '.
			'data-total-items="'.(int)$this->getTotalItems().'" '.
			'data-get-param="'.Convert::raw2att($this->getPaginationGetVar()).'"';

		if ($context) {
			$meta .= ' data-context="'.(int)$context.'"';
		}

		return $meta;
	}
}
