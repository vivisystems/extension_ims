<?php
App::import('Core', array('CakeLog'));

class ProductCost extends IMSAppModel {

    var $name = 'ProductCost';
    var $useDbConfig = 'inventory';

    function getLastModifiedRecords($lastModified = 0) {
        $costs = $this->find('all', array('fields'=>'id,avg_cost,last_cost,manual_cost,acc_qty,modified', 'conditions'=> "modified > $lastModified"));
        return Set::classicExtract($costs, '{n}.ProductCost');

    }

}

?>
