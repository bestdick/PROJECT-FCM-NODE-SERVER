<?php
function CreateRandomLottoNum($input, $targetRound, $date, $time){
  // srand(date("YmdHisu"));
  srand(date("dHisu"));
  // date_default_timezone_set('Asia/Seoul');
  // $timestamp = strtotime("Now");
  // $date = date("Y-m-d", $timestamp);
  // $time = date("H:i:s", $timestamp);

  $arrays = array();
  for($j = 0 ; $j < $input; $j++){

    $numbers = [];
    $bonus = 0;
    $i = 1;

    while($i <= 7)
    {
      if($i == 7){
        $number = mt_rand(1, 45);

        if(!in_array($number, $numbers))
        {
          $bonus = $number;
          $i++;
        }

      }else{
        $number = mt_rand(1, 45);

        if(!in_array($number, $numbers))
        {
            array_push($numbers, $number);
            $i++;
        }
      }

    }

    sort($numbers);

    //echo implode(" - ", $numbers);

    $array = array("Cdate"=>$date, "Ctime"=>$time, "TargetRound"=>$targetRound,
            "ln1"=>$numbers[0], "ln2"=>$numbers[1],
            "ln3"=>$numbers[2], "ln4"=>$numbers[3],
            "ln5"=>$numbers[4], "ln6"=>$numbers[5],
            "lbn"=>$bonus);


    array_push($arrays, $array);
  }
  return $arrays;
}







// gmp_testbit
//
//
//
//
// test
function CreateRandomLottoNum2($input, $targetRound, $date, $time, $conn, $targetTable){
  // srand(date("YmdHisu"));
  srand(date("is"));
  // date_default_timezone_set('Asia/Seoul');
  // $timestamp = strtotime("Now");
  // $date = date("Y-m-d", $timestamp);
  // $time = date("H:i:s", $timestamp);

  $arrays = array();
  for($j = 0 ; $j < $input; $j++){

    $numbers = [];
    $bonus = 0;
    $i = 1;

    while($i <= 7)
    {
      if($i == 7){
        $number = mt_rand(1, 45);

        if(!in_array($number, $numbers))
        {
          $bonus = $number;
          $i++;
        }

      }else{
        $number = mt_rand(1, 45);

        if(!in_array($number, $numbers))
        {
            array_push($numbers, $number);
            $i++;
        }
      }

    }

    sort($numbers);


    //echo implode(" - ", $numbers);

    $array = array("Cdate"=>$date, "Ctime"=>$time, "TargetRound"=>$targetRound,
            "ln1"=>$numbers[0], "ln2"=>$numbers[1],
            "ln3"=>$numbers[2], "ln4"=>$numbers[3],
            "ln5"=>$numbers[4], "ln6"=>$numbers[5],
            "lbn"=>$bonus);


    array_push($arrays, $array);
  }
  return $arrays;
}

function checkHowMany($conn, $targetTable, $input){
  $sql = "SELECT * FROM `$targetTable`
  WHERE ln1 = $input
  OR ln2 = $input
  OR ln3 = $input
  OR ln4 = $input
  OR ln5 = $input
  OR ln6 = $input";
  $result = mysqli_query($conn, $sql);
  $count = $result -> num_rows;
  return $count;
}
 ?>
