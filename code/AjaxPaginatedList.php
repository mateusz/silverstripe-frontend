<?php
/**
 * Adds support for frontend pagination.
 */

class AjaxPaginatedList extends PaginatedList
{

    protected $pjaxHeader = null;

    /**
     * Get the PJAX fetching header.
     */
    public function getPjaxHeader()
    {
        return $this->pjaxHeader;
    }

    /**
     * Enable PJAX fetching using the $header. Set $header to null to disable.
     */
    public function setPjaxHeader($header)
    {
        $this->pjaxHeader = $header;
        return $this;
    }

    /**
     * Generate metadata elements.
     *
     * @param int $context As in PaginatedList::PaginationSummary, how many pages 
     *		are to be displayed around the currently active page.
     * @param string $pjaxHeader Enable PJAX fetching with the assigned header.
     */
    public function PaginationMetadata($context = null, $pjaxHeader = null)
    {
        $meta =
            'data-page-start="'.(int)$this->getPageStart().'" '.
            'data-page-length="'.(int)$this->getPageLength().'" '.
            'data-total-items="'.(int)$this->getTotalItems().'" '.
            'data-get-param="'.Convert::raw2att($this->getPaginationGetVar()).'"';

        if ($context) {
            $meta .= ' data-context="'.(int)$context.'"';
        }

        if ($this->getPjaxHeader()) {
            $meta .= ' data-pjax-header="'.Convert::raw2att($this->getPjaxHeader()).'"';
        }

        return $meta;
    }
}
