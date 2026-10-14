USE dental_care_center;

INSERT INTO dentists (id,name,image,qualification,specialization,experience,description,timing) VALUES
(1,'Dr. Akhilesh Yadav','https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=450&fit=crop&auto=format','BDS, MDS (Orthodontics)','Orthodontics & Clear Aligners','12 Years','Orthodontics and clear aligner specialist.','Mon–Fri: 9AM–5PM'),
(2,'Dr. Rahul Mehta','https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=450&fit=crop&auto=format','BDS, MDS (Endodontics)','Root Canal Specialist','8 Years','Endodontics and root canal specialist.','Mon–Sat: 11AM–7PM'),
(3,'Dr. Ananya Joshi','https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=450&fit=crop&auto=format','BDS, Cert. Cosmetic Dentistry','Cosmetic & Smile Design','6 Years','Cosmetic dentistry and smile design specialist.','Tue–Sun: 10AM–6PM'),
(4,'Dr. Vikram Patel','https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=450&fit=crop&auto=format','BDS, MDS (Periodontology)','Gum Treatment & Surgery','10 Years','Periodontology and gum surgery specialist.','Mon–Sat: 2PM–9PM')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO services (id,name,description,category,image_icon,price,bg) VALUES
(1,'Dental Cleaning','Professional scaling and polishing to remove plaque, tartar, and stains for a fresh, healthy smile.','Preventive','sparkles','From ₹500','#00ABE4'),
(2,'Root Canal Treatment','Pain-free root canal therapy using advanced rotary techniques to save your natural tooth.','Restorative','alert-circle','From ₹2,500','#028090'),
(3,'Dental Implants','Titanium implants that look, feel, and function like natural teeth — a permanent, life-changing solution.','Restorative','award','From ₹15,000','#00ABE4'),
(4,'Braces & Aligners','Traditional braces and clear aligners to straighten teeth discreetly and effectively.','Cosmetic','layers','From ₹12,000','#028090'),
(5,'Teeth Whitening','Professional laser whitening treatments to remove stains and brighten your smile by several shades.','Cosmetic','smile','From ₹3,000','#00ABE4'),
(6,'Dental Crowns','Custom-made crowns and bridges to restore damaged or missing teeth with natural-looking aesthetics.','Restorative','crown','From ₹4,000','#028090'),
(7,'Veneers','Ultra-thin porcelain veneers that transform your smile by correcting shape, color, and alignment.','Cosmetic','eye','From ₹8,000','#00ABE4'),
(8,'Cosmetic Dentistry','Comprehensive smile makeovers combining multiple procedures tailored to your unique aesthetic goals.','Cosmetic','zap','Custom Quote','#028090'),
(9,'Pediatric Dentistry','Gentle, child-friendly dental care designed to make young patients comfortable and cavity-free.','Preventive','baby','From ₹400','#00ABE4'),
(10,'Gum Treatment','Advanced periodontal treatment including deep cleaning, scaling, and root planing for healthy gums.','Restorative','activity','From ₹1,500','#028090'),
(11,'Emergency Dental Care','Immediate relief for toothaches, broken teeth, and dental emergencies — available on priority 24/7.','Emergency','zap','Call Now','#B03A2E')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO gallery (id,image,title,caption,category) VALUES
(1,'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=700&h=500&fit=crop&auto=format','Modern dental clinic reception area','Modern dental clinic reception area','Clinic'),
(2,'https://images.unsplash.com/photo-1588776814546-1ffbb5b7dc8e?w=700&h=500&fit=crop&auto=format','State-of-the-art dental chair','State-of-the-art dental chair','Equipment'),
(3,'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=700&h=500&fit=crop&auto=format','Patient smile transformation result','Patient smile transformation result','Results'),
(4,'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=700&h=500&fit=crop&auto=format','Precision dental instruments and tools','Precision dental instruments and tools','Equipment'),
(5,'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=500&fit=crop&auto=format','Digital dental X-ray examination','Digital dental X-ray examination','Treatment'),
(6,'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&h=500&fit=crop&auto=format','Comfortable clinic waiting lounge','Comfortable clinic waiting lounge','Clinic')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO reviews (id,customer_name,review_text,rating,treatment,image_avatar,location) VALUES
(1,'Rajesh Kumar','I had severe tooth pain and was terrified of root canals. Dr. Rahul made the entire process completely painless. The clinic is spotless and the staff is incredibly warm. Absolutely recommend to anyone!',5,'Root Canal Treatment','RK','Andheri, Mumbai'),
(2,'Priya Nair','Got dental implants after losing a tooth in an accident. The results are phenomenal — I can\'t even tell which one is the implant! Dr. Vikram\'s expertise and attention to detail is simply unmatched.',5,'Dental Implants','PN','Goregaon, Mumbai'),
(3,'Arjun Singh','My Invisalign journey with Dr. Priya was transformational. 14 months and my smile is completely changed. The tracking appointments were always on time and the results speak for themselves.',5,'Clear Aligners','AS','Borivali, Mumbai'),
(4,'Sunita Desai','Brought my 7-year-old here and Dr. Ananya was just wonderful with him. He actually looks forward to dental visits now! The pediatric care here is truly exceptional and the staff is so patient.',5,'Pediatric Dentistry','SD','Malad, Mumbai'),
(5,'Mohammed Shaikh','Emergency chipped tooth on a Friday evening — they saw me within an hour. Excellent emergency care, very fair pricing, and the crown they placed looks completely natural.',5,'Emergency + Crown','MS','Jogeshwari, Mumbai')
ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name);
