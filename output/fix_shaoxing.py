import zipfile, os
import xml.etree.ElementTree as ET

docx_path = r'D:\紹興街住戶公約.docx'
out_path = r'g:\我的雲端硬碟\ai agent\Matt Pocock skills\output\紹興街住戶公約_修正完整版.docx'

with zipfile.ZipFile(docx_path, 'r') as zin:
    xml_content = zin.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    body = tree.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    
    p_xml = '''<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:pPr><w:pStyle w:val="Default"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="15"/></w:numPr><w:rPr><w:rFonts w:hAnsi="標楷體"/><w:color w:val="000000"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:hAnsi="標楷體" w:hint="eastAsia"/><w:color w:val="EE0000"/></w:rPr><w:t>以上條約不遵守者視同違約，房東有權利解約並沒收押金，檢查房屋現況。</w:t></w:r></w:p>'''
    
    new_p = ET.fromstring(p_xml)
    body.append(new_p)
    
    new_xml = ET.tostring(tree, encoding='utf-8', xml_declaration=True)

    with zipfile.ZipFile(out_path, 'w') as zout:
        for item in zin.infolist():
            if item.filename == 'word/document.xml':
                zout.writestr(item.filename, new_xml)
            else:
                zout.writestr(item.filename, zin.read(item.filename))

    tmp_path = docx_path + '.tmp'
    with zipfile.ZipFile(tmp_path, 'w') as zout:
        for item in zin.infolist():
            if item.filename == 'word/document.xml':
                zout.writestr(item.filename, new_xml)
            else:
                zout.writestr(item.filename, zin.read(item.filename))

os.replace(tmp_path, docx_path)
print('修正完成！已成功加回第 27 條違約沒收押金條款。')
