import os, json
library={}
data_dir='data'
for class_dir in sorted(os.listdir(data_dir)):
    class_path=os.path.join(data_dir,class_dir)
    if not os.path.isdir(class_path) or not class_dir.startswith('class'):
        continue
    grade=class_dir.replace('class','')
    for subject_dir in os.listdir(class_path):
        subject_path=os.path.join(class_path,subject_dir)
        if not os.path.isdir(subject_path):
            continue
        for root,_,files in os.walk(subject_path):
            for f in files:
                if f.lower().endswith('.pdf'):
                    subject=subject_dir
                    library.setdefault(subject,[])
                    rel_dir=os.path.relpath(root,class_path).replace('\\','_')
                    id_part=f"{class_dir}_{subject_dir}_{rel_dir}_{f}" if rel_dir not in ('.','') else f"{class_dir}_{subject_dir}_{f}"
                    title=os.path.splitext(f)[0].replace('_',' ').title()
                    library[subject].append({'id':id_part,'title':title,'grade':grade,'filename':f,'path':os.path.join(root,f)})
print(json.dumps({'subjects':[{'subject':k,'chapters':sorted(v,key=lambda x:(x['grade'],x['title']))} for k,v in library.items()]},indent=2))
