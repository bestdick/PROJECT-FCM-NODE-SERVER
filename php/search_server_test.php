<?php
$request_type= $_POST['request_type'];
$request_data = $_POST['request_data'];

// $token = $_GET['token'];

if($request_type == "search_server"){
  if($request_data == "chaegangjaji"){
    // access granted
    // $serverIP = "http://192.168.219.153:3000";
        // $serverIP = "http://192.168.219.123:3000";

      // $serverIP = "http://172.30.1.39:3000";
      // $serverIP= "http://122.46.245.107:50001";
       // $serverIP = "http://172.30.1.43:3000";

// real server
// $serverIP = "http://122.46.245.107:50003";

//test server
// $serverIP = "http://122.46.245.107:50001";
$serverIP = "http://192.168.219.184:3000";



       $version = "beta 01.01.01";
       // 처음 00 새로운 버전 출시
       // 두번째 00 디자인 체인지
       // 세번째 00 에러 수정
    echo json_encode(array("type"=>"normal", "serverIP"=>$serverIP, "version"=>$version));
    // $title ="서버 정검 중...";
    // $content = "서버 정검 중 입니다 \n 00 시 부터 00 시까지 00 시간 진행 될 예정입니다. \n 양해부탁드립니다. \n 감사합니다.";
    // echo json_encode(array("type"=>"server_check", "title"=>$title, "content"=>$content));
  }
}
 ?>
