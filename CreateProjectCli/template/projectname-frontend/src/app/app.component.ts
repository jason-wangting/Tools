import { AfterViewChecked, AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as ace from 'ace-builds';
import { HttpClient } from '@angular/common/http';
interface Port {
  name: string;
  description: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit{

  public codeText = '';
  public editorId = '1111';
  public isAdd: boolean;
  public isEdit: boolean;
  public name: string;
  public dataIn: string[] = [];

  public dataOut: string[] = [];
  public common: any;
  public eventIn: string[] = [];

  public eventOut: string[] = [];
  public subsription: Subscription[] = [];
  public objTypeArray: any[] = [];
  public err: string;
  public categories = [];
  public category: string;
  public syncSuccess = false;
  public syncFail = false;
  public saveModal = false;
  public editor: any;
  public edited: boolean;
  public filterCategory = [];
  
  public syntax = {
    msg: '',
    show: false,
  };
  public model = {
    name: 'Custom FB',
    path: ''
  };
  private defaultTemplate = `
from pub import getTopic,types

class CCTARoSDK_Multi_Robot_MoveTrajJoint:
    __description__ = {
        'IN_EVENT': ["INIT", "START"],
        'OUT_EVENT': ["INIT_OK", "DONE"],
        'IN_DATA': ["ROBOT_NAME", "TRAJECTORY", "CS_REF_VALUE", "CS_TOOL_VALUE"],
        'OUT_DATA': ["ERROR"]
    }
    def __init__(self, name):
        self.Name = name
        self.topic = getTopic()
        for ports in  CCTARoSDK_Multi_Robot_MoveTrajJoint.__description__.values():
            for port in ports:
                self.topic.subscribe(self.Name +"."+ port)

    def INPUT_INIT(self):
        #example
        self.OUTPUT_INIT_OK(0)

    def INPUT_START(self, robot_name, trajectory, cs_ref_value, cs_tool_value):
        # import time
        # time.sleep(1)
        self.OUTPUT_DONE(0)

    def OUTPUT_INIT_OK(self, error):
        pass

    def OUTPUT_DONE(self, error):
        pass

    def OUTPUT_ERROR(self, error):
        pass

    def __port_type__(PORTNAME):
        for item in types:
            if CCTARoSDK_Multi_Robot_MoveTrajJoint.__description__[item].__contains__(PORTNAME):
                return item
            else:
                return "unknown type"


  `;
  constructor(
    private http: HttpClient,
  ) {

  }

  async ngOnInit(): Promise<void> {

    // check grammer to do
    // if (this.codeText) {
    //   let res = (await this.systemservice.checkGrammer(this.codeText).toPromise());
    //   if (res.returnCode !== 0) {
    //     this.syntax.show = true;
    //     this.syntax.msg = res.data.message
    //   }
    // }
  }

  ngOnDestroy(): void {
    this.subsription.forEach(sub => sub.unsubscribe());

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.editor = ace.edit(this.editorId);
      this.editor.on('input', () => {
        this.refreshCode();
        console.log('clean?', this.editor.session.getUndoManager().isClean());
        this.edited = !this.editor.session.getUndoManager().isClean();
      });
      this.editor.setTheme('ace/theme/github');      // twilight  eclipse  github
      // this.editor.session.setMode("ace/mode/python");
      const mode: string = 'ace/mode/' + 'python';
      this.editor.session.setMode(mode);
      this.editor.setValue(this.codeText);
      this.editor.setOptions({
        wrap: false,
        fontSize: 16,
        tabSize: 4,
        // active auto prompt
        enableSnippets: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        mergeUndoDeltas: true,
        // autoScrollEditorIntoView: true,
      });
      this.editor.session.getUndoManager().markClean();

    }, 50);
  }

  public undo(): void {
    const undoManager = this.editor.session.getUndoManager();
    undoManager.undo();
  }

  public redo(): void {
    const undoManager = this.editor.session.getUndoManager();
    undoManager.redo();
  }

  public save(): void {
    this.editor.session.getUndoManager().markClean();
  }

  public setDefaultText(): void {
    const codeText = this.editor.getValue();
    let text: string = codeText ? codeText : this.defaultTemplate;
    // ------set class name start------
    const fbName = this.getFBname(text);
    if (!fbName) {
      console.error('Error Class Name.');
      return;
    }
    text = text.replace(new RegExp(fbName, 'g'), this.getClassName());
    // ------set class name end------

    // ------set event in port start ------
    const eventInstr = this.eventIn
      // event1 => "event1"
      .map(s => `"${s}"`)
      // ["event1", "event2"] => "event1","event2"
      .join(', ');
    text = text.replace(/'IN_EVENT': \[(.*)\],/, `'IN_EVENT': [${eventInstr}],`);
    // ------set event in port end ------

    // ------set event out port start ------
    const eventOutstr = this.eventOut
      .map(s => `"${s}"`)
      .join(', ');
    text = text.replace(/'OUT_EVENT': \[(.*)\],/, `'OUT_EVENT': [${eventOutstr}],`);
    // ------set event out port end ------

    // ------set data in port start ------

    const dataInstr = this.dataIn
      .map(s => `"${s}"`)
      .join(', ');
    text = text.replace(/'IN_DATA': \[(.*)\],/, `'IN_DATA': [${dataInstr}],`);

    // ------set data in port end ------

    // ------set data out port start ------
    const dataOutstr = this.dataOut
    .map(s => `"${s}"`)
    .join(', ');
    text = text.replace(/'OUT_DATA': \[(.*)\]/, `'OUT_DATA': [${dataOutstr}]`);
    // ------set data out port end ------

    // ------set input_ start ------
    const dataInString = this.dataIn.map(s => s.toLocaleLowerCase()).join(', ');
    if (this.dataIn.length === 0) {
      text = text.replace(/def INPUT_START\(self(, )?.*\):/, `def INPUT_START\(self):`);
    } else {
      text = text.replace(/def INPUT_START\(self(, )?.*\):/, `def INPUT_START\(self, ${dataInString}):`);
    }

    // const res = this.setDefaultTemplate(input, output, codeText);
    this.editor.setValue(text);
  }
  public onNameChange(): void {
    this.setDefaultText();
  }
  private getClassName(): string {
    return this.model.name.replace(/ /g, '_').toLocaleUpperCase();
  }
  private getFBname(text): string {
    const match = text.match(/class (.*):/);
    if (match) {
      return match[1];
    }
    return '';
  }
  public export(): void {
    this.http.post('http://localhost:3000/add',
    {str: this.editor.getValue(), name: this.getClassName(), path: this.model.path}).subscribe(data => {
      alert(JSON.stringify((data as any).msg));
    });
  }
  public portName(): string {
    const { dataIn, dataOut } = this;
    let length = 1;
    let data = `Data${length}`;
    while (dataIn.includes(data) || dataOut.includes(data)) {
      length = length + 1;
      data = `Data${length}`;
    }
    return data;
  }
  public eventportName(): string {
    const { eventIn, eventOut } = this;
    let length = 1;
    let data = `Event${length}`;
    while (eventIn.includes(data) || eventOut.includes(data)) {
      length = length + 1;
      data = `Event${length}`;
    }
    return data;
  }
  public addDataIn(): void {
    const data = this.portName();
    this.dataIn.push(data);
    this.setDefaultText();
  }

  public addDataOut(): void {
    const data = this.portName();
    this.dataOut.push(data);
    this.setDefaultText();
  }
  public addEventIn(): void {
    const data = this.eventportName();
    this.eventIn.push(data);
    this.setDefaultText();
  }

  public addEventOut(): void {
    const data = this.eventportName();
    this.eventOut.push(data);
    this.setDefaultText();
  }
  public deleteData(type, index): void {
    if (type === 0) {
      this.dataIn.splice(index, 1);
      this.setDefaultText();
    } else {
      this.dataOut.splice(index, 1);
      this.setDefaultText();
    }
  }
  public deleteEvent(type, index): void {
    if (type === 0) {
      this.eventIn.splice(index, 1);
      this.setDefaultText();
    } else {
      this.eventOut.splice(index, 1);
      this.setDefaultText();
    }
  }
  public async checkBeforeSave(): Promise<void> {
    // let result = await this.checkGrammer();
    // if (result.returnCode !== 0) {
    //   this.dialogService.confirmDialog({
    //     title: 'Warning',
    //     error: true,
    //     text: this.translate.instant('edit.x_function.save_error_01'),
    //     okcallback: () => {
    //       this.saveXFunction();
    //     },
    //     cancelcallback: () => {
    //       // this.common.modal.destroy();
    //     },
    //     okText: 'OK',
    //     cancelText: 'Cancel',
    //   });
    //   // this.message.error(this.translate.instant('edit.x_function.save_error_01'));
    //   this.syntax.show = true;
    //   this.syntax.msg = result.data.message;
    //   return;
    // } else {
    //   this.saveXFunction();
    // }
  }

  public async saveXFunction(): Promise<void> {
    // let result = this.checkSynchronize();
    // myLog(result);
    // if (result === false) {
    //   this.message.error(this.translate.instant('edit.x_function.save_error_02'));
    //   return;
    // }
    // result = this.checkCodeLength();
    // if (!result) return;
    // if (this.isEdit) {
    //   this.editTemplate();
    //   return;
    // }
    // if (this.isAdd) {
    //   this.saveSkillas();
    //   return;
    // }

    // let { name, category, dataIn, dataOut } = this;
    // let codeText = this.editor.getValue();
    // let ports = [];
    // let eventIn = {
    //   port_name: 'eventIn',
    //   port_label: 'Start',
    //   port_type: NodeType.EVENT_IN
    // };
    // let eventOut = {
    //   port_name: 'eventOut',
    //   port_label: 'Done',
    //   port_type: NodeType.EVENT_OUT
    // };
    // ports.push(eventIn, eventOut);

    // dataIn.forEach((item, index) => {
    //   ports.push({
    //     port_name: item,
    //     port_label: item,
    //     port_type: NodeType.DATA_IN
    //   });
    // });
    // dataOut.forEach((item, index) => {
    //   ports.push({
    //     port_name: item,
    //     port_label: item,
    //     port_type: NodeType.DATA_OUT
    //   });
    // });

    // let functionInfo = {name, category, codeText, ports};
    // let res = this.contextService.updateXfunction(this.common.contextParam, functionInfo, this.common.nodeId);
    // myLog(res);

    // let changedInfo = {
    //   changedPorts: res.data,
    //   skillId: this.common.nodeId
    // };
    // this.updateNodePort(changedInfo);
    // this.common.modal.destroy();
  }

  public updatePortService(increasePorts, decreasePorts, skillId, isLeftArray): void {
  //   this.emitService.updatePort.next({
  //     increasePorts,
  //     decreasePorts,
  //     skillId,
  //     isLeftArray,
  //   });
  }

  public updateNodePort(changedInfo): void {
    const {skillId, changedPorts} = changedInfo;

    if (changedPorts.dataIn.type === 1) {
    this.updatePortService([], changedPorts.dataIn.portArr, skillId, true);
    } else {
    this.updatePortService(changedPorts.dataIn.portArr, [], skillId, true);
    }

    if (changedPorts.dataOut.type === 1) {
    this.updatePortService([], changedPorts.dataOut.portArr, skillId, false);
    } else {
    this.updatePortService(changedPorts.dataOut.portArr, [], skillId, false);
    }
  }


  public saveSkillas(): void {
    // this.name = '';
    // this.categories = await this.categoryService.getPaletteData();
    // this.filterCategory = this.categories;
    // myLog(this.categories);
    // this.saveModal = true;
  }

  public async editTemplate(): Promise<void> {
    // let ports = [];
    // let eventIn = {
    //   port_name: 'eventIn',
    //   port_label: 'start',
    //   port_type: NodeType.EVENT_IN
    // };
    // let eventOut = {
    //   port_name: 'eventOut',
    //   port_label: 'done',
    //   port_type: NodeType.EVENT_OUT
    // };
    // ports.push(eventIn, eventOut);

    // this.dataIn.forEach((item, index) => {
    //   ports.push({
    //     port_name: item,
    //     port_label: item,
    //     port_type: NodeType.DATA_IN
    //   });
    // });
    // this.dataOut.forEach((item, index) => {
    //   ports.push({
    //     port_name: item,
    //     port_label: item,
    //     port_type: NodeType.DATA_OUT
    //   });
    // });

    // let name = this.name;
    // let category = this.category;
    // let codeText = this.editor.getValue();

    // this.contextService.saveXfunctionToPalette(this.common.contextParam, name, category, ports, codeText).then((res) => {
    //   this.message.create('success', this.translate.instant('edit.x_function.create_success'));
    //   this.saveModal = false;
    //   this.destroyModal();

    //   myLog(err);
    //   this.saveModal = false;
    //   this.destroyModal();
    // });
    // this.emitService.eventEmitCreateNewSkill.emit({
    //   refreshPalette: true,
    // });
  }


  public checkSynchronize(): boolean {
    const codeText = this.editor.getValue();
    const { dataIn, dataOut } = this;
    let result;

    const res = this.getParamByCode(codeText);
    if (!res) {
      return false;
    }
    if (res.dataIn.join() === dataIn.join() && res.dataOut.join() === dataOut.join()) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  public async checkGrammer(): Promise<void> {
    // let codeText = this.editor.getValue();
    // let res = (await this.systemservice.checkGrammer(codeText).toPromise());
    // // if (res.returnCode === 0) {
    // //   return true;
    // // } else {
    // //   return false;
    // // }
    // return res;
  }

  public checkCodeLength(): boolean {
    const codeTextLen = this.editor.getValue().split(' ').length;

    if (codeTextLen > 14000) {
      // this.message.warning(this.translate.instant('edit.x_function.warn_max_code_size'));
      return false;
    }
    return true;
  }

  public refreshCode(): void {
    const codeText = this.editor.getValue();
    const res = this.getParamByCode(codeText);
    if (!res) {
      return;
    }
    const { dataIn, dataOut } = res;
    this.dataIn = dataIn;
    this.dataOut = dataOut;
  }



public setDefaultTemplate (dataIn, dataOut, codeText?): string {
  return this.defaultTemplate;
  // let template = codeText ? codeText : xfuncTemplate;

  // let funcName = new RegExp(/X_FunctionBlock_Main\(.*?\)/);
  // let funcReturn = new RegExp(/return\s?\(.*?\)/);
  // let defaultData = new RegExp(/[\s\S]*def X_FunctionBlock_Main/);

  // let dataInStr = dataIn.join(',');
  // let dataOutStr = dataOut.join(',');

  // let defaultDataOutVal = ''
  // dataOut.forEach(d => {
  //   let str = `${d} = '{"default": "default"}' # output value must be a format json string \n`;
  //   defaultDataOutVal += str;
  // })

  // defaultDataOutVal = defaultDataOutVal + 'def X_FunctionBlock_Main';
  // console.log(defaultDataOutVal);

  // let res = template.replace(funcName, `X_FunctionBlock_Main(${dataInStr})`);
  // let res2 = res.replace(funcReturn, `return (${dataOutStr})`);
  // let res3;
  // if(dataOut.length > 0) {
  //   console.log(res2.match(defaultData))
  //   res3 = res2.replace(defaultData, defaultDataOutVal);
  // }
  // return res3 || res2;
  return '';
}

public getParamByCode(code): any {
  const funcName = new RegExp(/X_FunctionBlock_Main\(.*?\)/);
  const funcReturn = new RegExp(/return\s.*/);
  const dataInstrs = code.match(funcName);
  const dataOutStrs = code.match(funcReturn);
  if (!dataInstrs || !dataOutStrs) {
    return undefined;
  }
  const dataInStr = dataInstrs[0];
  const dataOutStr = dataOutStrs[0];

  const dataIn = dataInStr.substring(dataInStr.indexOf('(') + 1, dataInStr.indexOf(')')).split(',');
  let dataOut = [];
  console.log(dataOutStr);
  if (dataOutStr.indexOf('(') !== -1 && dataOutStr.indexOf(')') !== -1) {
    const str = dataOutStr.substring(dataOutStr.indexOf('(') + 1, dataOutStr.indexOf(')'));
    if (str) {
      dataOut = str.split(',').map(s => s.trim());
    }
  } else {
    const res = dataOutStr.replace(/return\s/, '');
    dataOut = [res];
  }
  console.log(dataIn, dataOut);
  this.trimArray(dataIn);
  this.trimArray(dataOut);

  return {
    dataIn,
    dataOut
  };
}

public trimArray(str): void {
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '' || str[i] === null || typeof(str[i]) === undefined) {
        str.splice(i, 1);
        i = i - 1;
    }
  }
}

}
