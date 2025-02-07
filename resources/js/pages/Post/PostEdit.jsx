import React, {useEffect, useState} from 'react'
import {Button, ButtonGroup, Col, Container, Dropdown, DropdownButton, Form, OverlayTrigger, Popover, Row, Tooltip} from "react-bootstrap";
import Editor from "react-editor-md";
import Upload from 'rc-upload'
import axios from '../../configs/axios'
import {Tips} from "../../configs/function";
import {useBoolean, useObject} from "react-hooks-easy";
import PostCascader from "./PostCascader";
import PostTemplate from "./PostTemplate";
import PostSavedTemplate from "./PostSavedTemplate";
import PostAddTemplate from "./PostAddTemplate";
import JSONToRequestTable from "./JSON/JSONToRequestTable";
import JSONToResponseTable from "./JSON/JSONToResponseTable";
import JSONParse from "./JSON/JSONParse";

window.editormd.defaults.toolbarIconsClass['template'] = 'fa-circle';
window.editormd.defaults.toolbarHandlers['template'] = () => {alert(1)};
let postId, setPostId, name, setName, parentId, setParentId, attachments, setAttachments, editor = {};
export default function PostEdit(props){
    const project = useObject('project');
    const templateShow = useBoolean('postSavedTemplate', false);
    const postAddTemplate = useBoolean('postAddTemplate', false);
    const JsonToRequestTable = useBoolean('JsonToRequestTable', false);
    const JsonToResponseTable = useBoolean('JsonToResponseTable', false);
    const JsonParse = useBoolean('JsonParse', false);
    [postId, setPostId] = useState(-1);
    [name, setName] = useState('');
    [parentId, setParentId] = useState(0);
    [attachments, setAttachments] = useState([]);
    const [parents, setParents] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadingProgress, setUploadingProgress] = useState(false);
    const project_id = props.match.params.project_id;
    
    useEffect(() => {
        init();
        return () => {
            editor = {};
            postId = undefined;
            setPostId = undefined;
            name = undefined;
            setName = undefined;
            parentId = undefined;
            setParentId = undefined;
            attachments = undefined;
            setAttachments = undefined;
        }
    }, []);
    
    async function init(){
        if(props.match.params.id > 0){
            let res = await axios.get('/post/'+props.match.params.id+'/edit');
            setParents(res.parents);
            setPostId(res.id);
            setName(res.name);
            setParentId(res.pid);
            setAttachments(res.attachments);
            let interval = setInterval(() => {
                if(editor.id){
                    clearInterval(interval);
                    editor.setMarkdown(res.content);
                }
            }, 100);
        }else{
            setPostId(0);
            if(props.location.search){
                let from = props.location.search.split('=')[1];
                let res = await axios.get('/post/'+from);
                let interval = setInterval(() => {
                    if(editor.id){
                        clearInterval(interval);
                        editor.setMarkdown(res.content);
                    }
                }, 100);
            }
        }
    }
    
    async function submit(){
        let pid = parentId;
        let content = editor.getMarkdown();
        let html = editor.getHTML();
        let res = await axios.post('/post/'+postId, {name,content, html, pid, project_id, attachments});
        setPostId(res.id);
        Tips('保存完成', 'success');
    }
    
    function back(){
        if(postId){
            let url = '/project/'+project_id+'/post/'+postId;
            props.history.push(url);
        }else{
            props.history.goBack();
        }
        
    }
    
    function insertTemplate(type){
        let temp = '';
        switch (type) {
            case 'api':
                temp = PostTemplate.Api();
                break;
            case 'table':
                temp = PostTemplate.Table();
                break;
        }
        editor.focus().replaceSelection(temp);
    }
    
    function insertContent(content){
        editor.focus().replaceSelection(content);
    }
    
    // 删除附件
    function delAttachment(index){
        let attachments2 = [...attachments];
        attachments2.splice(index, 1);
        setAttachments(attachments2);
    }
    
    return (
        <div className={'px-5 pt-3 b-5'}>
            <Form onSubmit={(event) => {event.preventDefault()}}>
                <Container fluid className={'p-0'}>
                    <Row noGutters onKeyDown={async (e) => {
                        let ctrlKey = e.ctrlKey || e.metaKey;
                        if( ctrlKey && e.keyCode === 83 ){
                            e.preventDefault();
                            let goBack = false;
                            if(e.shiftKey){
                                goBack = true;
                            }
                            await submit();
                            if(goBack){
                                back();
                            }
                        }
                    }}>
                        <Col>
                            <Form.Group>
                                文档名：
                                <Form.Control className={'d-inline'} value={name} onChange={(event) => setName(event.target.value)} style={{width: '180px'}} />
                                <OverlayTrigger
                                    placement="bottom"
                                    delay={{ show: 500, hide: 0 }}
                                    overlay={<Tooltip id={'tooltip-sort'}>
                                        使用退格键依次删除
                                    </Tooltip>}
                                >
                                    <span className={'ml-3'}>上级目录：</span>
                                </OverlayTrigger>
                                <PostCascader project_id={project_id} post_id={postId} parents={parents} onChange={(val) => setParentId(val)} />
                            </Form.Group>
                        </Col>
                        <Col xs={3} className={'text-right'}>
                            
                            <Dropdown as={ButtonGroup}>
                                <Button variant={"outline-primary"} type={'submit'} onClick={() => submit()}>保存</Button>
        
                                <Dropdown.Toggle split variant="outline-primary" />
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => postAddTemplate.set(true)}>另存为模版</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            <Button variant={'outline-dark'} onClick={() => back()} className={'ml-4'}>返回</Button>
                        </Col>
                    </Row>
                    <Row noGutters>
                        <Col>
                            <Form.Group>
                                <Button variant={'outline-dark'} onClick={() => insertTemplate('api')}>插入API接口模版</Button>
                                <Button variant={'outline-dark'} className={'ml-3'} onClick={() => insertTemplate('table')}>插入数据字典模版</Button>
                                <Button variant={'outline-dark'} className={'ml-3'} onClick={() => templateShow.set(true)}>已保存模版</Button>
                                <DropdownButton className={'ml-3 d-inline-block'} variant={'outline-dark'} id={'manager'} title={'JSON 工具'}>
                                    <Dropdown.Item onClick={() => JsonToRequestTable.set(true)}>JSON 转参数表格</Dropdown.Item>
                                    <Dropdown.Item onClick={() => JsonToResponseTable.set(true)}>JSON 转返回值表格</Dropdown.Item>
                                    <Dropdown.Item onClick={() => JsonParse.set(true)}>JSON 美化</Dropdown.Item>
                                </DropdownButton>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className={'py-2'}>
                        <Editor config={{
                            width: '100%',
                            height: 1000,
                            path: '/editor.md/lib/',
                            // emoji: false,
                            imageUploadURL: '/api/upload_md',
                            editorTheme: 'default',
                            onload: (edit, func) => {
                                let duplicate = ()=>{
                                    let cursor = edit.getCursor();  //  {line: 5, ch: 14}
                                    edit.setSelection({line: cursor.line, ch: 0}, {line: cursor.line+1, ch: 0});
                                    let line_data = edit.getSelection({line: cursor.line, ch: 0}, {line: cursor.line+1, ch: 0})
                                    if(line_data.substr(-1, 1) !== '\n'){
                                        line_data += '\n';
                                    }
                                    edit.replaceSelection(line_data+line_data);
                                    edit.setCursor({...cursor, line: cursor.line+1});
                                }
                                edit.removeKeyMap({'Shift-Ctrl-S'(){}});
                                edit.removeKeyMap({'Cmd-D'(){}});
                                edit.addKeyMap({
                                    'Cmd-S'(){
                                        submit();
                                    },
                                    'Ctrl-S'(){
                                        submit();
                                    },
                                    'Cmd-D'(){
                                        duplicate();
                                    },
                                    async 'Shift-Cmd-S'(){
                                        await submit();
                                        back();
                                    },
                                    async 'Shift-Ctrl-S'(){
                                        await submit();
                                        back();
                                    },
                                });
                                editor = edit;
                            },
                            markdown: '\n'
                        }} />
                    </div>
                </Container>
            </Form>
            {/*附件*/}
            <div className={'my-2 d-flex align-items-center'}>
                <Upload
                    action={'/api/upload'}
                    onStart={() => {setUploading(true); setUploadingProgress(0)}}
                    onProgress={(e) => setUploadingProgress(Math.round(e.percent))}
                    onError={() => setUploading(false)}
                    onSuccess={(res, file) => {
                        setUploading(false);
                        let attachments2 = [...attachments];
                        attachments2.unshift(res.data.file);
                        setAttachments(attachments2);
                    }}
                >
                    <Button variant={"outline-info"}>上传附件</Button>
                </Upload>
                <div className={'ml-3'}>{uploading ? '上传中...'+uploadingProgress+'%' : ''}</div>
            </div>
            <ul>
                {attachments.map((attachment, index) => (
                    <li key={attachment} title={'在新窗口预览/下载'}><a href={attachment} target={'_blank'}>{attachment.split('/').pop()}</a> <a title={'删除此附件'} style={{cursor: "pointer"}} className={'ml-1 text-danger'} onClick={() => delAttachment(index)}>&times;</a></li>
                ))}
            </ul>
            <PostSavedTemplate project_id={project_id} onSubmit={(template) => {
                editor.focus().replaceSelection(template);
            }} />
            <PostAddTemplate project_id={project_id} getContent={() => editor.getMarkdown()} />
            <JSONToRequestTable insertContent={insertContent} />
            <JSONToResponseTable insertContent={insertContent} />
            <JSONParse />
            <p className={'text-muted'}>焦点定于任意输入框中可使用快捷键操作</p>
            <p className={'text-muted'}>Ctrl/Cmd + S 保存</p>
            <p className={'text-muted'}>Ctrl/Cmd + Shift + S 保存并返回列表</p>
        </div>
    );
}
