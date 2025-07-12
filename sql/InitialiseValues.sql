-- PUT Sample Insert Statements Here for values

-- Module 3: Transport Navigator
-- Sample data for facilities
INSERT INTO Facilities (
    name, address, facilityType, phoneNo, hours,
    image_url, static_map_url, latitude, longitude,
    google_place_id
)
VALUES
    ('Bukit Panjang Polyclinic', 
    '50 Woodlands Rd, #03-02, Singapore', 
    'Polyclinic', 
    '6908 2222', 
    'Monday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Tuesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Wednesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Thursday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Friday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Saturday: 8:00 AM - 12:30 PM; Sunday: Closed',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpe0VXI08H39yiBv_f99RLm0d7Yb0-_isIvPBx5US7eDmQ0w-Th0Dk_0K8azJVIgdm6eykcDfx3h2vi8aj6cRtWhwOxrcperM3n4c-ukaKWn-VQP_7cVMvVHIkUlE0m6CKOXwor2cHvBEER1keMHGsnqsxUrulxMJGlGuIXbiq3O4PlhK5buW3-KlFXmpwYbVGw0Fyfxq-NpJyS7uZd3Ru4HCW3jpab-9oaaamViSX67inxGw6hFnSTB_GjLD8Kimfg7Z5oM_0_OwXFyAvuvPrqR8P0S58JzICoI8482_68p1C7EtO5ZwlYEEXso1zZtX-Q7ts2yatett5Tm449cqXaQAUc9vnR9jhbaHXAE_SL2Mx49pfIL1NIK2gCYi7_xsY2WlH-iXGpB5zurZB3x7Wb9bNBAjuYXS-pfrD2sdNibpo7eimxCQIo6ZA275_-uHFMnUqoV_6P7DPvtIKN_aWKLpVxBLuc0l4nfSJitapCl8aVmE4UXTP1ZmwsuZ5zzL8-ODMLfgihTEuiwPORDYJJh8oq34RBKGxCNHG-cbTQnS0m0-94AGW5R--LSf9WgwXGKYU7d&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3830275,103.7598355&zoom=15&size=400x200&markers=color:red%7C1.3830275,103.7598355&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3830275, 
    103.7598355,
    'ChIJzYwU2PoR2jERoCNtSpIlsQU'
    ),
    ('Kallang Polyclinic', 
    '701 Serangoon Rd, Singapore', 
    'Polyclinic', 
    '6355 3000', 
    'Monday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Tuesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Wednesday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Thursday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Friday: 8:00 AM - 1:00 PM, 2:00 - 4:30 PM; Saturday: 8:00 AM - 12:30 PM; Sunday: Closed',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpctCOJDv6VngJwnpPjD0c28m5jFFFeXUyYFrhBGZbASUZ66KYikikBMm-GAIyH6cvHpj0C2Yo5oxq08bcKe6ScSMJrfHVOWmFmTa8-WxHv5vW4jsx4gmMz0izh8EKylaAVvjieGooF-3hf5xhc48-Gcx7DrXK7_5pwrwMCtuC-CZbPWgI50fjz_9H5IHYiYPrcaWYYlNmG3ZBtav7CZEHGL8jxw-REt_5nRBgXTHFlu2V5FU7FFNw7IsmjC3fJxi2_WSZbh7QLRVxpXKBSevdeLnitZhGCwEdyEVD5KopG32sLXTpcBGQqu7ShTu6gzlEhASc0NYsrBd9qBRBgQtBV6TOYdvnEeAt3RReITpMk9YdAuKKzkfBzYFaRHfdtZJ_XdgkyLKpZJczmg_K97TF2raEo6mz4gMlQRJfwZsBdRo6ZzT5JnL6mCsuF_q8w7gE-ZxufJhiIISQcXhAHeQFTPDnq5sT04i5I85UhZ-15KhzDVu-s8xg-UPReuuGXM_u8A5MtNjSAexjjB09srscECHy216vYlxSDHCxTX5BUl8TzrF7QGHeqghZF9O4oz8PRFE30u&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3166556,103.8586735&zoom=15&size=400x200&markers=color:red%7C1.3166556,103.8586735&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3166556, 
    103.8586735,
    'ChIJW-QhM_kZ2jEReRtSMTpBYcM'
    ),
    ('Gleneagles Hospital', 
    '6A Napier Road', 
    'Hospital', 
    '6575 7575', 
    'Monday: Open 24 hours; Tuesday: Open 24 hours; Wednesday: Open 24 hours; Thursday: Open 24 hours; Friday: Open 24 hours; Saturday: Open 24 hours; Sunday: Open 24 hours',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpfn8yvQ5FyJg3s8rc9ujll86_FsJFqHoJ6kGVu49_ssbFuquGhhZTEcdchAAhODCG7xBzlntvYFLS1z1mIZY3boJps5WyM10G85iPb4zrXv3BDyQ6K2DCIcAlYwx13VgomXHiSVwwvdkdmt7NLHS0cyB5eLMurWNKbxocPVeM_E_yX30-eKICS4dtKwqmZtdEspY0xdcMVXbKYMNYfCRgxkWDg4BThdmjZr0IC7VXyGeyFAFzkKqin77JWiXrp4nXuqlHzKPPJgw6S4KZRmg96puOiQpdib0o-a1Ip4FoG9ONlKyp8C5_ChGZoIwj6XVU-S_GnFnXI&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3830275,103.7598355&zoom=15&size=400x200&markers=color:red%7C1.3830275,103.7598355&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcYhttps://maps.googleapis.com/maps/api/staticmap?center=1.3076174,103.8198659&zoom=15&size=400x200&markers=color:red%7C1.3076174,103.8198659&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3076174, 
    103.8198659,
    'ChIJWXTRJCAa2jERXNBB0kxTWSU'
    ),
    ('Mount Alvernia Hospital', 
    '820 Thomson Road', 
    'Hospital', 
    '6347 6688', 
    'Monday: Open 24 hours; Tuesday: Open 24 hours; Wednesday: Open 24 hours; Thursday: Open 24 hours; Friday: Open 24 hours; Saturday: Open 24 hours; Sunday: Open 24 hours',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpcZEtk_d2nmm1udd1Jjm4SeOQDgMMPqNpyRUtw8dYE7K00hl07DilsFH_sciAediZMNH9YtjXuqYJRzHhtmyfHd8UZDtD6MkKgVyLNkfgBlDhtYEM8DYNuG-U0MvYSN0zkPj03KldRSTdymWjgBiQTaxdIqls4S0wQObwqguNJgjHvngVby2pge9tK5MjJNS6ankJgfaLNWuJlhYqmaq4L5RoqMbAXmpmtU_K4ihDNJQVezoitWPimPsMNqyCEy-RPRViA9m38QqE_n7U1XI9hdYpgXMjO4WACICYZ4xD5g0BHXzSByWwAXf6S6hmsTrRo5cCyT&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3419494,103.8377041&zoom=15&size=400x200&markers=color:red%7C1.3419494,103.8377041&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3419494, 
    103.8377041,
    'ChIJ0yUHzEYX2jERjwP0e9XyUpk'
    ),
    ('Singapore Botanic Gardens', 
    '1 Cluny Road, Singapore', 
    'Park', 
    '6471 7138', 
    'Monday: 5:00 AM - 12:00 AM; Tuesday: 5:00 AM - 12:00 AM; Wednesday: 5:00 AM - 12:00 AM; Thursday: 5:00 AM - 12:00 AM; Friday: 5:00 AM - 12:00 AM; Saturday: 5:00 AM - 12:00 AM; Sunday: 5:00 AM - 12:00 AM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpd1oMcxkBv-4xzProJp7RmLKURmzQHQMUIiUp0sYO6H4ZSEb-KPZM0pleiChWV_Pzd3GmtIJgbGH7k6cmm-JCFkVwwEzUlfoouC9sUSoKS4g_76Kr-vh2ghBRgYSfkT6dRizmyjW5X8dtrQcwhsMe_ebYeV-AfRi60UMEVuZtHJiHv_c2ukujs4xaiA-jsmQsnA3COk_pEDCqKckfGOAz-3n9McFioWJuRIgTpRa0x45ixo_ABfhzR0ki2f8b7pyKYgjOSQST3d2uY6-D27mSCtQh9JgD6FoEjDqLlTW8BanBa7vbCJIkbF9S3zvcEciE-B1fQEmrq6fglFi0fijdngg8BcxK49Awt3wtcf8WqyvOt55utxHMCUwV5d51IIleT2YzaAOyt69ATJKsN1WQ8pOzzkjr58yj1e3PhmXqRLbX9D64rM11uSWWxZXjuwCOKBof4qc9GEOMzBXqFf4okcRHfRIW20rdnAxQRpVeePMhfL3r_Qwirjtvb63oFaDYNlV5TRhnY_nyQCT3A55UYtWK-0xxJvkYQmuT2eBNYqiRoHQgU12oKb1mtgRXtztlD57GP0bVNyunrR4RsOgS-RDQTOJEhQh0YKfNIcZ1p2xd_4WVLWFJe-EcP9c-Dn6e0L3Q&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3138397,103.8159136&zoom=15&size=400x200&markers=color:red%7C1.3138397,103.8159136&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3138397, 
    103.8159136,
    'ChIJvWDbfRwa2jERgNnTOpAU3-o'
    ),
    ('Gardens by the Bay', 
    '18 Marina Gardens Drive', 
    'Park', 
    '6420 6848', 
    'Monday: 5:00 AM - 2:00 AM; Tuesday: 5:00 AM - 2:00 AM; Wednesday: 5:00 AM - 2:00 AM; Thursday: 5:00 AM - 2:00 AM; Friday: 5:00 AM - 2:00 AM; Saturday: 5:00 AM - 2:00 AM; Sunday: 5:00 AM - 2:00 AM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpecmCaXeJXgBs08qNBMSRreiIeFFIc5bNfoWOSH4qZAjILG7umimX9IRiAZE4j3AbsHHxKrQ49_IoGTPumOpMpCVnOepWOyctNqoZ-SUNgszN7cUtLGlrhuhYKrr-cZrJbkhgcPN6h9xqTMqlD8Vi1ifNHkEvDbFbnHbQwpAZ818OZ_Uck-bpDbEdnHppwCsx7f0609oP4MY54qTgjJDnwf2CN_FcFQd0nHYDUaDBqlQfxQ4JJJqW8GunwTo1x-LoQXHS4_8q0dWkBcmT0z9eBcrQl59q5_TIDsGz9gMmdVBT9hwUNZmucXFGPDAZA1aIKBzkKeIidG-bDXnF_urHy8MKPlU5yE_fTV1Ak6SwkOKOsAtmujalY_qDq-jqWEw79owvqYa_nfY1TcUCBDH4z6UHO3B0S6I_mxpZmPkxf5HK9PdEfA_MCPtwRvk9fY9DXYlBMzOtnbRg6Hmd5WHTeTgDBssOx9gaER0EK9YuMm4Sa33lrXP1Na_hheMg6zrkPsbNvKxtRRinZ57olb6H97mwanpeyFhB9S7Ie3YyxTW8ZQR77x8Tl7-Vw4HA2XJ4Tn8lUlJ1JPB0CmCAo4H29ig-rWR6YR3XXkctj7MkNq7rVjWopj21A-8RvF0fBq08JJZw&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.2815683,103.8636132&zoom=15&size=400x200&markers=color:red%7C1.2815683,103.8636132&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.2815683, 
    103.8636132,
    'ChIJMxZ-kwQZ2jERdsqftXeWCWI'
    ),
    ('Jalan Besar Community Club', 
    '69 Jellicoe Rd, Singapore', 
    'Community Center', 
    '6298 6110', 
    'Monday: 9:00 AM - 10:00 PM; Tuesday: 9:00 AM - 10:00 PM; Wednesday: 9:00 AM - 10:00 PM; Thursday: 9:00 AM - 10:00 PM; Friday: 9:00 AM - 10:00 PM; Saturday: 9:00 AM - 10:00 PM; Sunday: 9:00 AM - 10:00 PM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpdlXiU1VcZ4bEXqVafaWcbtLACPIJF2mT2QZk3Om_HeM-GyQhNqPQnvmvC8XZPQ9uuAaR_VkjpxLLztrBK0u6eUmdvuBi2VC7swpM5-bRGFoatM45JyiDJm3SoXcaGYO_gl2zRvric1EKPlpn6A2PbMbfupjBjQ0NcjJG1TkufGiFjN3gGJqwAzf5wRlTp1ewcsyneTF5I78H2m3sN9UujFDA07aKuJ2FcxnnWvzrggjRZ10bCjqsuC6HgWF_ahk0mMOfsmRwV4CIcOifCW8dEk9bHWyVauxhTcF7PkN4w8VRaRpAm7FQXydbwl6oFmh39WKffb3ujtc-aQcisHyKNNqvOFiVCAxjVNdpbPvZoSHUbJGZqB-ZmgcY5KmWknpUQEDQEBxR4nZ7EBgl69x4ScmOQ8sQ_KP4pPqIiD4TGKrzm0yxSJtvHivJgUeEmED9unIuCSLQNX4mF5Rl_CghQYBQpWf6Aawjmu4R393g0_EMM1zFxwy9hd8m5_amoTfG5mCVevY79pcEtnLKfLNl5FEt3LjP-Py4Dmpsk7bOsRH1JDUT4hXwEUHVUlqlEErOol6gAZ&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.3078946,103.8617082&zoom=15&size=400x200&markers=color:red%7C1.3078946,103.8617082&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.3078946, 
    103.8617082,
    'ChIJd4Ja-ckZ2jERhr2arEOISJg'
    ),
    ('Tanjong Pagar Community Club', 
    '101 Cantonment Rd, Singapore', 
    'Community Center', 
    '6221 9898', 
    'Monday: 10:00 AM - 6:00 PM; Tuesday: 10:00 AM - 6:00 PM; Wednesday: 10:00 AM - 6:00 PM; Thursday: 10:00 AM - 6:00 PM; Friday: 10:00 AM - 6:00 PM; Saturday: 10:00 AM - 6:00 PM; Sunday: 10:00 AM - 6:00 PM',
    'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=ATKogpffUxEy2DC3X2lH92Y4gVPBByDBD2c6vQHpNIqbBFjMjTSm2cl5bQzhJahiI4ehwMsQf21vthpMi4Qk7FqqGgteAK8v0ML_tCBgJXsvOB9TqxvYe2Qgqs4yRDIIcR_n8Ycl7ZM7V2iWDKfYMJA1MhI-hae-jqOgwP4-vg_qtg_Hpu3BdDAR8eV_RSi26FQvRH_Pnxiibr9D2g0h8q2jNRRD-sFy3tMJ6i_coFWzDDKzoTjIzugCvDVXJNkZwnIAX9_ZuYIqwnzXl6BkwWV4Pl5Ui7Hz4UAfcpFLJrm6lgEBUqc_--LEOj2GkLy05W5DbbD5PQBGVUf6V_yAY3XzoY6MYmrZvcXq6zBl513rOdMrQC_Hm6DUdjrCkAlYlqOpuMzqADpuHKjE8FLri8IPzU9itmm6UD53T8j86VWFlYZJR1xsXidf6bZh_SaCzxRc63twQ_rnCNDYAw0V6jBnWbCHsad-ysC9kffoMgvIzbXAMhChyXkao29NKjjKmhSfG441PauL2t2G1vB50p16GgnPf7WZzTD99XsdHBVYc-HSVwwAxPYnVfwFP-TWMxTPNOP6vsL0&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    'https://maps.googleapis.com/maps/api/staticmap?center=1.2761083,103.8416067&zoom=15&size=400x200&markers=color:red%7C1.2761083,103.8416067&key=AIzaSyBMliDZnqF0C-lmEE9JvHG6K_vESF48HcY', 
    1.2761083, 
    103.8416067,
    'ChIJoSghZGwZ2jERh4q9jEcnnXM'
    );

-- Sample data for reviews
INSERT INTO Reviews (
    userId, facilityId, rating, comment
)
VALUES
    (1, 1, 5, 'Great service and friendly staff!'),
    (2, 1, 4, 'Good facilities but can be crowded at times.'),
    (1, 2, 3, 'Average experience, nothing special.')
    (2, 2, 5, 'Excellent care and very clean environment!'),
    (3, 1, 4, 'Very professional staff and quick service.');
