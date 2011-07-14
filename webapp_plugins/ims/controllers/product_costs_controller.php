<?php

class ProductCostsController extends IMSAppController {

    var $name = 'ProductCosts';

    var $uses = array('ims.ProductCost');

    var $components = array('SyncHandler', 'Security');


    /**
     * Get stock records by last modified and response format JSON
     *
     * @param <type> $lastModified 
     */
    function getLastModifiedRecords($lastModified = 0) {

        $result = array('status' => 'error', 'code' => 400 );

        $now = time();

        $costs = $this->ProductCost->getLastModifiedRecords($lastModified);

        if (is_array($costs)) {

            $result = array('status' => 'ok', 'code' => 200 );
            $result['response_data'] = $this->SyncHandler->prepareResponse($costs, 'bgz_json');

        }

        $responseResult = $this->SyncHandler->prepareResponse($result, 'json');

        echo $responseResult ;
        exit;

    }

}
?>
