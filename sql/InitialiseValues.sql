-- PUT Sample Insert Statements Here for values
SET IDENTITY_INSERT Users ON;

INSERT INTO Users (
  userID,
  email,
  password,
  name,
  aboutMe,
  phoneNumber,
  dateOfBirth,
  profilePicture,
  createdAt,
  updatedAt,
  isActive
)
VALUES (
  1,
  'ranen@gmail.com',
  '$2b$05$roSzDWAjjGhHLWuWFLUJWO2pspgpw8ESJUNnqpEct6u3xD7M3i40q',
  'Ranen Sim',
  NULL,
  '55555555',
  '2000-01-01',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/profile_pictures%2F1752402549388_Penguin%20PFP%20Rounded.png',
  '2025-07-13 18:29:11.453',
  '2025-07-13 18:29:11.453',
  1
);

SET IDENTITY_INSERT Users OFF;

-- Module 3: Community Events
-- Sample data for community groups
INSERT INTO Groups (Name, Description, GroupPicture, IsPrivate, CreatedAt, CreatedBy)
VALUES 
(
  'Nature Explorers of Singapore - Hiking and Trails',
  'Join fellow nature lovers on weekend hikes, wildlife spotting, and eco-outings across Singapore’s best parks and hidden trails. Everyone is welcome, no experience needed!',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402184362_couple-hiking-mountain-climbing.jpg',
  0,
  '2025-07-13 10:23:05.883',
  1
),
(
  'Singapore Tech Talk Collective - AI, Apps, and Mor',
  'Dive into lively discussions on artificial intelligence, mobile apps, smart gadgets, and tech news over casual meetups. Great for all ages and skill levels.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402245024_tech%20talks.jpg',
  0,
  '2025-07-13 10:24:06.550',
  1
),
(
  'Golden Groove Society - Music Lovers and Jammers',
  'Whether you sing, strum, or just love to listen, this group connects generations through music appreciation sessions, informal jam nights, and storytelling.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402291784_655e0fa544c67c1ee5ce0f7c_how-to.jpg',
  0,
  '2025-07-13 10:24:53.320',
  1
),
(
  'Book Buddies Reading Circle - Monthly Book Discuss',
  'From thrillers to biographies, our members vote on a new book every month and meet to discuss over tea. Ideal for casual readers and literary enthusiasts alike.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402308787_older-male-friends-reading-newsp.jpg',
  0,
  '2025-07-13 10:25:10.370',
  1
),
(
  'Early Risers Walking Group - Morning Wellness Stro',
  'Kickstart your mornings with a refreshing walk and friendly chatter. We explore parks, gardens, and local landmarks while promoting healthy living and community bonding.',
  'https://storage.googleapis.com/bed-circlelife-t02.firebasestorage.app/communityEvents%2F1752402321077_360_F_462429607_hh4RpG0tYZ5j9BFx.jpg',
  0,
  '2025-07-13 10:25:22.573',
  1
);




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


-- Module 4: Senior Fitness Coach
-- Sample Data

-- Categories
INSERT INTO categories (name) VALUES
('Limited Mobility / Seated Exercises'),
('Full Mobility / Active Seniors'),
('Heart Health & Light Cardio'),
('Relaxation & Flexibility');

-- Exercises
INSERT INTO exercises (title, description, image_url, categoryId, benefits) VALUES
-- Category 1: Limited Mobility / Seated Exercises
('Seated Knee Lifts', 
 'A simple seated movement that strengthens thighs and supports circulation. Ideal for those with limited mobility.', 
 '/exercise/images/seated_knee_lifts.png', 1,
 'This exercise helps stimulate blood flow in your legs and strengthens your thigh muscles. You may feel improved lower-body control and reduced stiffness.'),
 
('Seated Arm Circles', 
 'A gentle arm movement performed while seated to promote flexibility and shoulder mobility.', 
 '/exercise/images/seated_arm_circles.png', 1,
 'Expect improved range of motion in your shoulders and upper arms. You’ll feel more limber and energized in your upper body.'),

('Seated Toe Taps', 
 'Tap your toes to light music while seated. Helps with ankle flexibility and blood flow.', 
 '/exercise/images/seated_toe_taps.png', 1,
 'Your ankles will feel more mobile and engaged. This light cardio can also boost circulation in your lower legs.'),

('Chair Yoga', 
 'A gentle form of yoga performed while seated or using a chair for support. Great for beginners and people with limited mobility.', 
 '/exercise/images/chairyoga.png', 1,
 'You should feel a sense of calm, reduced stress, and gentle flexibility. Expect improved posture and mental clarity after the session.'),

-- Category 2: Full Mobility / Active Seniors (Outdoor Activities)
('Guided Nature Walk', 
 'A leisurely outdoor walk through parks or gardens that promotes mobility, cardiovascular health, and mental wellness.', 
 '/exercise/images/guided_nature_walk.png', 2,
 'You’ll feel refreshed and energized, with better circulation and cardiovascular endurance. The outdoor setting also supports mental relaxation.'),

('Outdoor Tai Chi', 
 'A flowing, low-impact movement routine practiced in open spaces to improve balance, flexibility, and mindfulness.', 
 '/exercise/images/outdoor_tai_chi.png', 2,
 'You will notice increased mental clarity and body control. Expect a sense of peace and enhanced joint flexibility.'),

('Park Pole Stretches', 
 'Use walking poles or park railings to support gentle stretches for the arms, shoulders, and back.', 
 '/exercise/images/park_pole_stretches.png', 2,
 'This routine promotes flexibility and eases muscular tension in the upper body. You’ll finish with a looser, more open posture.'),

-- Category 3: Heart Health & Light Cardio
('Walk in Place', 
 'A gentle way to get the heart pumping by walking on the spot. Great for warming up or light movement.', 
 '/exercise/images/walk_in_place.png', 3,
 'Your heart rate will gently increase, supporting cardiovascular fitness. You’ll feel warmer, more awake, and physically active.'),

('Seated Jumping Jacks', 
 'A safe, modified version of jumping jacks done while seated. Encourages full-body movement.', 
 '/exercise/images/seated_jumping_jacks.png', 3,
 'You’ll activate both your arms and legs while staying seated. Expect a light cardio boost and improved coordination.'),

('Side Steps with Arm Swings', 
 'Step side to side while gently swinging arms to boost heart rate and coordination.', 
 '/exercise/images/side_steps_arm_swings.png', 3,
 'This movement increases your overall mobility and elevates heart rate. It also improves coordination between upper and lower body.'),

-- Category 4: Relaxation & Flexibility
('Neck Rolls', 
 'A calming movement to reduce neck stiffness and relax upper body muscles. Done gently while seated.', 
 '/exercise/images/neck_rolls.png', 4,
 'Expect a noticeable release of tension in your neck and shoulders. You may feel more at ease and less stiff in your upper body.'),

('Deep Breathing', 
 'A mindful breathing technique to promote relaxation and reduce stress. Can be done anywhere.', 
 '/exercise/images/deep_breathing.png', 4,
 'You will feel calmer and more centered, with slower breathing and reduced tension. It helps reset your body and mind.'),

('Gentle Seated Twists', 
 'Turn your upper body slowly while seated to stretch the spine and improve flexibility.', 
 '/exercise/images/gentle_seated_twists.png', 4,
 'This twist can enhance spinal flexibility and circulation. You’ll finish feeling refreshed and more mobile in your upper torso.');

-- Exercises steps
INSERT INTO exercise_steps (exerciseId, step_number, instruction) VALUES
-- Seated Knee Lifts
(1, 1, 'Sit upright on a sturdy chair with feet flat on the ground.'),
(1, 2, 'Place hands on the sides of the chair for balance.'),
(1, 3, 'Lift your right knee slowly toward your chest.'),
(1, 4, 'Lower your right leg back to the floor.'),
(1, 5, 'Lift your left knee toward your chest.'),
(1, 6, 'Lower your left leg back to the floor.'),
(1, 7, 'Repeat for 10–12 repetitions per leg.'),

-- Seated Arm Circles
(2, 1, 'Sit comfortably with your back straight.'),
(2, 2, 'Extend both arms out to the sides at shoulder height.'),
(2, 3, 'Slowly make small circles with your arms forward.'),
(2, 4, 'Increase the size of the circles gradually.'),
(2, 5, 'Reverse and make circles in the opposite direction.'),
(2, 6, 'Lower arms and relax.'),
(2, 7, 'Repeat 2–3 sets as comfortable.'),

-- Seated Toe Taps
(3, 1, 'Sit on a chair with your feet flat and back straight.'),
(3, 2, 'Tap your toes on the ground while keeping your heels down.'),
(3, 3, 'Tap in rhythm, alternating feet if desired.'),
(3, 4, 'Add light music for pacing if preferred.'),
(3, 5, 'Continue tapping for 20–30 seconds.'),
(3, 6, 'Rest and repeat for 2 more rounds.'),

-- Chair Yoga
(4, 1, 'Sit on a chair with your back straight and feet grounded.'),
(4, 2, 'Inhale deeply and raise your arms overhead.'),
(4, 3, 'Exhale and slowly bend forward, reaching toward your toes.'),
(4, 4, 'Return to upright and twist gently to the right.'),
(4, 5, 'Return to center and twist to the left.'),
(4, 6, 'Raise arms again and take a deep breath.'),
(4, 7, 'Exhale and lower arms to relax.'),

-- Guided Nature Walk
(5, 1, 'Start at a comfortable walking pace.'),
(5, 2, 'Take deep breaths and observe your surroundings.'),
(5, 3, 'Maintain good posture and relaxed arms.'),
(5, 4, 'Pause at intervals to stretch or rest.'),
(5, 5, 'Hydrate if needed and continue walking.'),
(5, 6, 'Walk for 15–30 minutes depending on ability.'),

-- Outdoor Tai Chi
(6, 1, 'Stand tall with feet shoulder-width apart.'),
(6, 2, 'Inhale and slowly raise both arms in front of you.'),
(6, 3, 'Exhale while bending knees slightly and pushing arms forward.'),
(6, 4, 'Perform gentle flowing movements in a continuous rhythm.'),
(6, 5, 'Shift weight from one leg to the other slowly.'),
(6, 6, 'Repeat basic forms for 5–10 minutes.'),
(6, 7, 'End by standing still and breathing deeply.'),

-- Park Pole Stretches
(7, 1, 'Stand near a walking pole or railing.'),
(7, 2, 'Place hands on the pole at shoulder height.'),
(7, 3, 'Step back slightly and stretch your arms forward.'),
(7, 4, 'Hold the stretch for 10–15 seconds.'),
(7, 5, 'Perform side stretches by leaning to each side.'),
(7, 6, 'Gently rotate shoulders and back using the pole.'),
(7, 7, 'Repeat each stretch 2–3 times.'),

-- Walk in Place
(8, 1, 'Stand with feet shoulder-width apart.'),
(8, 2, 'Begin marching gently in place.'),
(8, 3, 'Swing arms naturally for balance.'),
(8, 4, 'Increase pace slightly to elevate heart rate.'),
(8, 5, 'Continue walking for 1–2 minutes.'),
(8, 6, 'Slow down gradually and stop.'),
(8, 7, 'Repeat for 2–3 rounds with rest.'),

-- Seated Jumping Jacks
(9, 1, 'Sit upright in a chair with feet flat.'),
(9, 2, 'Extend arms and legs outwards like a jumping jack.'),
(9, 3, 'Return arms and legs to the center.'),
(9, 4, 'Continue the motion in a rhythmic pattern.'),
(9, 5, 'Maintain a steady pace for 30 seconds.'),
(9, 6, 'Rest and repeat 2 more sets.'),

-- Side Steps with Arm Swings
(10, 1, 'Stand with feet together and arms by your side.'),
(10, 2, 'Step to the right and swing arms gently forward.'),
(10, 3, 'Step back to center and repeat to the left.'),
(10, 4, 'Keep movements light and controlled.'),
(10, 5, 'Repeat steps for 1–2 minutes.'),
(10, 6, 'Rest and do another set if desired.'),

-- Neck Rolls
(11, 1, 'Sit or stand comfortably.'),
(11, 2, 'Tilt your head gently toward your right shoulder.'),
(11, 3, 'Roll your head slowly to the front.'),
(11, 4, 'Continue rolling to the left shoulder.'),
(11, 5, 'Complete a full circle slowly and gently.'),
(11, 6, 'Reverse direction and repeat.'),
(11, 7, 'Do 3–5 neck rolls per direction.'),

-- Deep Breathing
(12, 1, 'Sit or lie down in a relaxed position.'),
(12, 2, 'Close your eyes and place one hand on your chest.'),
(12, 3, 'Inhale slowly through your nose for 4 seconds.'),
(12, 4, 'Hold your breath for 2 seconds.'),
(12, 5, 'Exhale slowly through your mouth for 6 seconds.'),
(12, 6, 'Repeat the breathing cycle for 5–10 minutes.'),

-- Gentle Seated Twists
(13, 1, 'Sit tall in a sturdy chair with feet flat.'),
(13, 2, 'Place right hand on the left knee.'),
(13, 3, 'Gently twist your upper body to the left.'),
(13, 4, 'Hold for 5–10 seconds while breathing.'),
(13, 5, 'Return to center and repeat on the other side.'),
(13, 6, 'Do 3–5 repetitions per side.');
