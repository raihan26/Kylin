select lstg_format_name, 
 sum(price) as GMV, 
 count(1) as TRANS_CNT 
 from test_kylin_fact 
 where "TEST_KYLIN_FACT"."LSTG_FORMAT_NAME" in ('Auction', 'ABIN') and (CASE WHEN ("TEST_KYLIN_FACT"."LSTG_FORMAT_NAME" IN ('Auction', 'FP-GTC')) THEN 'Auction' ELSE "TEST_KYLIN_FACT"."LSTG_FORMAT_NAME" END) = 'Auction'
 group by lstg_format_name 