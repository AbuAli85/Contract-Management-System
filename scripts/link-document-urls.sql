-- ============================================================================
-- LINK PROMOTER DOCUMENT URLs FROM STORAGE BUCKET
-- ============================================================================
-- This script updates the promoters table with URLs from the storage bucket
-- Files are matched by document numbers in the filename
-- ============================================================================

-- 1. Update ID Card URLs (match by id_card_number in filename)
UPDATE promoters
SET id_card_url = CASE 
  WHEN id_card_number = '131052976' THEN 'muhammad_ehtisham_zubair_131052976.png'
  WHEN id_card_number = '131092996' THEN 'Muhammad_qamar_131092996.png'
  WHEN id_card_number = '132593631' THEN 'vishnu_dathan_binu_132593631.png'
  WHEN id_card_number = '127133486' THEN 'ali_usman_chaudhary_127133486.jpeg'
  WHEN id_card_number = '118523645' THEN '118523645_118523645.jpeg'
  WHEN id_card_number = '133399341' THEN 'husnain_sohail_butt_133399341.jpeg'
  WHEN id_card_number = '132891974' THEN 'sagar_aranakkal_bharathan_132891974.jpeg'
  WHEN id_card_number = '118536616' THEN 'syed_atif_118536616.jpeg'
  WHEN id_card_number = '139642513' THEN 'abdelrhman_ahmed_hassan_abdelmoniem_hassan_139642513.jpeg'
  WHEN id_card_number = '139449759' THEN 'pachlasawala_fakhruddin_139449759.jpeg'
  WHEN id_card_number = '139729557' THEN 'haider_ali_gulam_abbas_merchant_139729557.jpeg'
  WHEN id_card_number = '128306174' THEN 'usman_javed_128306174.png'
  WHEN id_card_number = '133453221' THEN 'umesh_purushothaman_nair_133453221.png'
  WHEN id_card_number = '122682385' THEN 'karam_din_122682385.png'
  WHEN id_card_number = '130901665' THEN 'faisal_siddique_130901665.png'
  WHEN id_card_number = '135661163' THEN 'ahmad_yar_135661163.png'
  WHEN id_card_number = '122193536' THEN 'sajjad_hussain_122193536.png'
  WHEN id_card_number = '82201743' THEN 'rasheed_bilavinakath_82201743.png'
  WHEN id_card_number = '120935447' THEN 'muhammad_azeem_120935447.png'
  WHEN id_card_number = '122193414' THEN 'muhammad_arshad_122193414.png'
  WHEN id_card_number = '120312229' THEN 'bilal_ahmed_bhatti_120312229.png'
  WHEN id_card_number = '125414055' THEN 'amir_sohail_125414055.png'
  WHEN id_card_number = '123078831' THEN 'abdelrehim_salah_mohamed_youssef_123078831.png'
  WHEN id_card_number = '119168562' THEN 'abdul_wahab_makki_ali_119168562.png'
  WHEN id_card_number = '94186337' THEN 'luqman_shahzada_94186337.png'
  WHEN id_card_number = '117236752' THEN 'hasan_alam_117236752.png'
  WHEN id_card_number = '82772987' THEN 'bilal_nabi_bakhsh_82772987.png'
  WHEN id_card_number = '125806906' THEN 'ali_turab_shah_125806906.png'
  WHEN id_card_number = '122082033' THEN 'ali_husnain_karamat_ali_122082033.png'
  WHEN id_card_number = '89805577' THEN 'mohammad_mujahid_arafat_89805577.png'
  WHEN id_card_number = '122872062' THEN 'muhammad_waqar_122872062.png'
  WHEN id_card_number = '125122593' THEN 'muhammad_jasim_125122593.png'
  WHEN id_card_number = '124447607' THEN 'kaif_ali_khan_124447607.png'
  WHEN id_card_number = '126541462' THEN 'habeeb_adnan_habeeb_ali_126541462.png'
  WHEN id_card_number = '126274968' THEN 'muhammad_asim_zafar_126274968.png'
  WHEN id_card_number = '120779336' THEN 'adeel_aziz_120779336.png'
  WHEN id_card_number = '111036863' THEN 'siddiq_syed_111036863.png'
  WHEN id_card_number = '123800795' THEN 'syed_ghazanfar_hussain_bukhari_123800795.png'
  WHEN id_card_number = '127856499' THEN 'shahid_mehmood_127856499.png'
  WHEN id_card_number = '120998703' THEN 'muhammad_sajjad_khan_120998703.png'
  WHEN id_card_number = '123112472' THEN 'muhammad_amir_123112472.png'
  WHEN id_card_number = '122278065' THEN 'mubeen_pasha_mohammed_122278065.png'
  WHEN id_card_number = '106720768' THEN 'azhar_habib_106720768.png'
  WHEN id_card_number = '109440067' THEN 'ayub_ansari_109440067.png'
  WHEN id_card_number = '69880143' THEN 'abdullah_muhammad_ilyas_69880143.png'
  WHEN id_card_number = '122923821' THEN 'kashif_ali_122923821.png'
  WHEN id_card_number = '128458933' THEN 'yasir_karuppanooppan_abdul_128458933.png'
  WHEN id_card_number = '138774648' THEN 'mohamed_yahia_mohamed_abdelmonem_138774648.png'
  WHEN id_card_number = '123220767' THEN 'shahmeer_abdul_sattar_123220767.png'
  WHEN id_card_number = '122762672' THEN 'rashid_bilal_122762672.png'
  WHEN id_card_number = '123273988' THEN 'muhammad_asjad_sultan_123273988.png'
  WHEN id_card_number = '128792664' THEN 'mahaboob_pasha_shaik_128792664.png'
  WHEN id_card_number = '122980957' THEN 'haseeb_arslan_122980957.png'
  WHEN id_card_number = '138805516' THEN 'abdelazim_magdi_abdelazim_138805516.png'
  WHEN id_card_number = '132512669' THEN 'yasir_ali_132512669.png'
  WHEN id_card_number = '133107708' THEN 'syed_roshaan_e_haider_abbas_jafri_133107708.png'
  WHEN id_card_number = '131209751' THEN 'rameez_ramzan_131209751.png'
  WHEN id_card_number = '132288583' THEN 'muhammad_zeeshan_132288583.png'
  WHEN id_card_number = '132503026' THEN 'muhammad_rehan_132503026.png'
  WHEN id_card_number = '133114906' THEN 'muhammad_mohsin_133114906.png'
  WHEN id_card_number = '132313438' THEN 'muhammad_maqsood_132313438.png'
  WHEN id_card_number = '131950953' THEN 'muhammad_farooq_131950953.png'
  WHEN id_card_number = '72005969' THEN 'marijoe_bulabon_pino_72005969.png'
  WHEN id_card_number = '131055335' THEN 'hafiz_muhammad_bilal_131055335.png'
  WHEN id_card_number = '131720497' THEN 'ahmed_khalil_131720497.png'
  WHEN id_card_number = '121494177' THEN 'muhammad_junaid_121494177.png'
  WHEN id_card_number = '122330428' THEN 'mohammed_khaleel_122330428.jpeg'
  WHEN id_card_number = '117104738' THEN 'muhammad_waqas_117104738.jpeg'
  WHEN id_card_number = '105749346' THEN 'asad_shakeel_105749346.jpeg'
  WHEN id_card_number = '103774071' THEN 'muhammad_rehan_103774071.jpeg'
  WHEN id_card_number = '121924781' THEN 'abdul_basit_121924781.jpeg'
END
WHERE id_card_number IN (
  '131052976', '131092996', '132593631', '127133486', '118523645', '133399341', '132891974', '118536616',
  '139642513', '139449759', '139729557', '128306174', '133453221', '122682385', '130901665', '135661163',
  '122193536', '82201743', '120935447', '122193414', '120312229', '125414055', '123078831', '119168562',
  '94186337', '117236752', '82772987', '125806906', '122082033', '89805577', '122872062', '125122593',
  '124447607', '126541462', '126274968', '120779336', '111036863', '123800795', '127856499', '120998703',
  '123112472', '122278065', '106720768', '109440067', '69880143', '122923821', '128458933', '138774648',
  '123220767', '122762672', '123273988', '128792664', '122980957', '138805516', '132512669', '133107708',
  '131209751', '132288583', '132503026', '133114906', '132313438', '131950953', '72005969', '131055335',
  '131720497', '121494177', '122330428', '117104738', '105749346', '103774071', '121924781'
);

-- 2. Update Passport URLs (match by passport_number in filename)
UPDATE promoters
SET passport_url = CASE
  WHEN passport_number = 'fu5097601' THEN 'muhammad_ehtisham_zubair_fu5097601.png'
  WHEN passport_number = 'fd4227081' THEN 'Muhammad_qamar_fd4227081.png'
  WHEN passport_number = 't9910557' THEN 'vishnu_dathan_binu_t9910557.png'
  WHEN passport_number = 'bz4191823' THEN 'ali_usman_chaudhary_bz4191823.jpeg'
  WHEN passport_number = 's8978258' THEN '118523645_s8978258.jpeg'
  WHEN passport_number = 'y2769195' THEN 'sagar_aranakkal_bharathan_y2769195.jpeg'
  WHEN passport_number = 'y1766498' THEN 'syed_atif_y1766498.jpeg'
  WHEN passport_number = 'r7705778' THEN 'pachlasawala_fakhruddin_r7705778.jpeg'
  WHEN passport_number = 'v9443612' THEN 'zainul_abedeen_v9443612.png'
  WHEN passport_number = 'y6602275' THEN 'umesh_purushothaman_nair_y6602275.png'
  WHEN passport_number = 'te5155561' THEN 'sohail_shahid_te5155561.png'
  WHEN passport_number = 'lj0166621' THEN 'rehan_mehmood_lj0166621.png'
  WHEN passport_number = 'dg1919272' THEN 'muhammad_arshad_dg1919272.png'
  WHEN passport_number = 'bq317280' THEN 'bilal_ahmed_bhatti_bq317280.png'
  WHEN passport_number = 'mn5194661' THEN 'amir_sohail_mn5194661.png'
  WHEN passport_number = 'a29181561' THEN 'abdelrehim_salah_mohamed_youssef_a29181561.png'
  WHEN passport_number = 'Ry5141352' THEN 'luqman_shahzada_Ry5141352.png'
  WHEN passport_number = 't4054174' THEN 'hasan_alam_t4054174.png'
  WHEN passport_number = 'tn5155381' THEN 'ali_turab_shah_tn5155381.png'
  WHEN passport_number = 'R7770883' THEN 'kaif_ali_khan_R7770883.png'
  WHEN passport_number = 'v5193825' THEN 'habeeb_adnan_habeeb_ali_v5193825.png'
  WHEN passport_number = 'W3851075' THEN 'siddiq_syed_W3851075.png'
  WHEN passport_number = 'dn0164532' THEN 'shahid_mehmood_dn0164532.png'
  WHEN passport_number = 'jv1226902' THEN 'muhammad_amir_jv1226902.png'
  WHEN passport_number = 'b6299354' THEN 'yasir_karuppanooppan_abdul_b6299354.png'
  WHEN passport_number = 'ew3702661' THEN 'rashid_bilal_ew3702661.png'
  WHEN passport_number = 'fd5771881' THEN 'muhammad_asjad_sultan_fd5771881.png'
  WHEN passport_number = 'a40106645' THEN 'abdelazim_magdi_abdelazim_a40106645.png'
  WHEN passport_number = 'ak99101752' THEN 'muhammad_rehan_ak99101752.png'
  WHEN passport_number = 'bm0119601' THEN 'muhammad_mohsin_bm0119601.png'
  WHEN passport_number = 'at0317461' THEN 'muhammad_maqsood_at0317461.png'
  WHEN passport_number = 'ps3706431' THEN 'hafiz_muhammad_bilal_ps3706431.png'
  WHEN passport_number = 'ka8796232' THEN 'muhammad_junaid_ka8796232.png'
  WHEN passport_number = 'b9791051' THEN 'mohammed_khaleel_b9791051.jpeg'
  WHEN passport_number = 'BS5165582' THEN 'asad_shakeel_BS5165582.jpeg'
  WHEN passport_number = 'bd9104492' THEN 'muhammad_rehan_bd9104492.jpeg'
  WHEN passport_number = 'at3877032' THEN 'abdul_basit_at3877032.jpeg'
END
WHERE passport_number IN (
  'fu5097601', 'fd4227081', 't9910557', 'bz4191823', 's8978258', 'y2769195', 'y1766498', 'r7705778',
  'v9443612', 'y6602275', 'te5155561', 'lj0166621', 'dg1919272', 'bq317280', 'mn5194661', 'a29181561',
  'Ry5141352', 't4054174', 'tn5155381', 'R7770883', 'v5193825', 'W3851075', 'dn0164532', 'jv1226902',
  'b6299354', 'ew3702661', 'fd5771881', 'a40106645', 'ak99101752', 'bm0119601', 'at0317461', 'ps3706431',
  'ka8796232', 'b9791051', 'BS5165582', 'bd9104492', 'at3877032'
);

-- 3. Verification Query - Check Muhammad Ehtisham Zubair specifically
SELECT 
  name_en,
  id_card_number,
  id_card_url,
  passport_number,
  passport_url
FROM promoters
WHERE id_card_number = '131052976' OR passport_number = 'fu5097601';

-- 4. Summary - Count how many URLs were linked
SELECT 
  COUNT(*) as total_promoters,
  COUNT(id_card_url) as promoters_with_id_card_url,
  COUNT(passport_url) as promoters_with_passport_url,
  COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) as promoters_with_both
FROM promoters;

-- ============================================================================
-- EXPECTED OUTPUT:
-- - Muhammad Ehtisham Zubair should now have both URLs populated
-- - Summary should show all matched documents linked
-- ============================================================================

