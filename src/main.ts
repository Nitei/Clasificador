import 'zone.js/dist/zone';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TypeInitializationModes = 'raw' | 'orFn' | 'ternary' | 'ternaryFn';

const sample = {
  title: '',
  headerCols: [''],
  all: {
    columns: {
      colsExtraWidth: 0,
      widthMaxPX: 0,
      heightMaxPX: 0,
    },
  },
};

const a = {
  value: '',
  disabled: false,
  setDisable(state: 'true' | 'false' | 'toggle') {
    this.disabled = true;
  },
};

const defaultConfig = {
  assignmentMode: 'raw' as TypeInitializationModes, // TODO: falta por terminar
  addGetters: false, // TODO: falta por testear con los nuevos cambios
  addSetters: false, // TODO: falta por testear con los nuevos cambios
  defaultValueTitle: 'Foo',
  defaultValueNumber: '-1',
  defaultValueString: '',
  defaultValueBoleans: 'null',
};

export class Tale {
  constructor(public lines = [''], public config = defaultConfig) {}

  addLine(line: string) {
    this.lines.push(line);
    return {
      addIndents: (quantity: number) => {
        let lastLine = this.lines.pop();
        lastLine = getIndent(quantity) + lastLine;
        this.lines.push(lastLine);
      },
      onTop: () => {
        let lastLine = this.lines.pop();
        this.lines.unshift(lastLine as string);
      },
    };
  }

  removeLine() {
    return {
      last: () => {
        this.lines.pop();
      },
      by: {
        index: (idx: number) => {
          this.lines.splice(idx, 1);
        },
        string: (str: string) => {
          this.lines.splice(
            this.lines.findIndex((sample) => str === sample),
            1
          );
        },
      },
    };
  }

  getText() {
    return this.lines.join('\n');
  }
}

/** Obtenemos el nombre de la clase que siempre tendrá una coletilla al final, en este caso será Model */
function getClassName(name: string) {
  return capitalize(name) + 'Model';
}

/** Capitalizazión de un texto */
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

/** Creacion del getter */
function addGetter(key: string) {
  return `${getIndent(1)}get${capitalize(key)}() {
    ${getIndent(1)}return this.${key};
  }`;
}

/** Creacion del getter */
function addSetter(key: string, value: any) {
  return `${getIndent(1)}set${capitalize(key)}(${key}: ${getTypeOf(value)}) {
    ${getIndent(1)}this.${key} = ${key};
  }`;
}

/** Obtenemos la indentacion necesaria en base al número de espacios dado como parámetro */
function getIndent(indents: number) {
  let indentation = '';
  for (let index = 0; index < indents; index++) {
    indentation += ' ';
  }
  return indentation;
}

/** Azucar sintactico para un typeof */
function getTypeOf(value: any) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'boolean';
  return typeof value;
}

/** Mas azúcar */
function getTypeOfArray(value: any) {
  return `${getTypeOf(value)}[]`;
}

/** Mas azúcar */
function getInitializationByMode(
  key: string,
  defaultValue: any,
  mode: TypeInitializationModes
) {
  if (mode === 'raw') return `data?.${key} || ${defaultValue}`;
  if (mode === 'orFn') return `or(data?.${key}, ${defaultValue})`;
  if (mode === 'ternary')
    return `data?.${key} ? data?.${key} : ${defaultValue}`;
  if (mode === 'ternaryFn')
    return `ternary(data?.${key}, data?.${key}, ${defaultValue})`;
}

/** Obtenemos la asignación en el constructor */
function getInitializedAssign(key: string, value: any, tale: Tale) {
  if (getTypeOf(value) === 'string')
    return getInitializationByMode(
      key,
      `\"${tale.config.defaultValueString}\"` || "''",
      tale.config.assignmentMode
    );
  if (getTypeOf(value) === 'number')
    return getInitializationByMode(
      key,
      tale.config.defaultValueNumber,
      tale.config.assignmentMode
    );
  if (getTypeOf(value) === 'boolean' || value === undefined)
    return getInitializationByMode(
      key,
      tale.config.defaultValueBoleans,
      tale.config.assignmentMode
    );
  return '';
}

/** Azucar sintactico para aplicar una funcion a todas las entries de un objeto */
function applyFnForEachEntryOfObject(
  obj: any,
  fn: (key: string, value: any) => void
) {
  Object.entries(obj).forEach((prop) => {
    const key = prop[0];
    const value = prop[1];

    fn(key, value);
  });
}

function generateGettersAndSetters(tale: Tale, data: any) {
  if (tale.config.addGetters) {
    tale.addLine('');
    tale.addLine('// ==================================').addIndents(2);
    tale.addLine('// ============= GETTERS ============').addIndents(2);
    tale.addLine('// ==================================').addIndents(2);
    tale.addLine('');

    applyFnForEachEntryOfObject(data, (key) => {
      tale.addLine(addGetter(key));
      tale.addLine('');
    });
    tale.removeLine().last();
  }

  if (tale.config.addSetters) {
    tale.addLine('');
    tale.addLine('// ==================================').addIndents(2);
    tale.addLine('// ============= SETTERS ============').addIndents(2);
    tale.addLine('// ==================================').addIndents(2);
    tale.addLine('');

    applyFnForEachEntryOfObject(data, (key, value) => {
      tale.addLine(addSetter(key, value));
      tale.addLine('');
    });
  }
}

function generateClassKnowedDefinition(tale: Tale, data: any) {
  if (getTypeOf(data) === 'object') {
    applyFnForEachEntryOfObject(data, (key, value) => {
      const initialization =
        getTypeOf(value) === 'object' ? getClassName(key) : getTypeOf(value);

      let line = `${key}: ${initialization};`;
      tale.addLine(line).addIndents(2);
    });
  }
}

function generateClassKnowedAsignation(tale: Tale, data: any) {
  if (getTypeOf(data) === 'object') {
    applyFnForEachEntryOfObject(data, (key, value) => {
      let line = `this.${key} = ${getInitializedAssign(key, value, tale)};`;
      if (getTypeOf(value) === 'object') {
        line = `this.${key} = new ${getClassName(key)}(data?.${key});`;
        tale.addLine('').onTop();
        tale
          .addLine(generateClassKnowed(value, { className: key }, tale.config))
          .onTop();
      }
      tale.addLine(line).addIndents(4);
    });
  }
}

function generateClassKnowed(
  data: any,
  extra = { className: '' },
  config: typeof defaultConfig
) {
  let { className } = extra;
  let tale = new Tale([`export class ${getClassName(className)} {`], config);

  // Creando declaracion
  generateClassKnowedDefinition(tale, data);

  tale.addLine('');
  tale
    .addLine(`constructor(data?: Partial<${getClassName(className)}>) {`)
    .addIndents(2);

  generateClassKnowedAsignation(tale, data);

  tale.addLine('}').addIndents(2);

  generateGettersAndSetters(tale, data);

  tale.addLine('}');

  return tale.getText();
}

function generateClassDefinition(tale: Tale, data: any) {
  applyFnForEachEntryOfObject(data, (key, value) => {
    const initialization =
      getTypeOf(value) === 'array' ? getTypeOfArray(value) : getTypeOf(value);

    let line = `${key}: ${initialization};`;

    if (getTypeOf(value) === 'array') {
      if (getTypeOf(value[0]) === 'object') {
        const clase = generateClassKnowed(
          value[0],
          { className: key },
          tale.config
        );
        tale.addLine('').onTop();
        tale.addLine(clase).onTop();

        line = `${key}: ${getClassName(key)}[];`;
      } else {
        line = `${key}: ${getTypeOfArray(value[0])};`;
      }
    }

    if (getTypeOf(value) === 'object') {
      const clase = generateClassKnowed(value, { className: key }, tale.config);
      tale.addLine('').onTop();
      tale.addLine(clase).onTop();

      line = `${key}: ${getClassName(key)};`;
    }
    tale.addLine(line).addIndents(2);
  });
}

function generateClassAsignation(tale: Tale, data: any) {
  applyFnForEachEntryOfObject(data, (key, value) => {
    let line = `this.${key} = ${getInitializedAssign(key, value, tale)};`;

    if (getTypeOf(value) === 'object') {
      line = `this.${key} = new ${getClassName(key)}(data?.${key});`;
    }

    if (getTypeOf(value) === 'array') {
      if (getTypeOf(value[0]) === 'object') {
        line = `this.${key} = data?.${key}?.map((a: any) => new ${getClassName(
          key
        )}(a)) : [];`;
      } else {
        line = `this.${key} = ${getInitializationByMode(
          key,
          '[]',
          tale.config.assignmentMode
        )};`;
      }
    }
    tale.addLine(line).addIndents(4);
  });
}

function generateClass<T = any>(data: T, config: typeof defaultConfig) {
  let tale = new Tale(
    [`export class ${getClassName(config.defaultValueTitle)} {`],
    config
  );

  generateClassDefinition(tale, data);

  tale.addLine('');
  tale
    .addLine(
      `constructor(data?: Partial<${getClassName(config.defaultValueTitle)}>) {`
    )
    .addIndents(2);

  generateClassAsignation(tale, data);

  tale.addLine('}').addIndents(2);

  generateGettersAndSetters(tale, data);

  tale.addLine('}');

  tale.addLine('').onTop();

  if (tale.config.assignmentMode === 'ternaryFn') {
    tale
      .addLine(
        'const ternary = (chekeable: any, resultIfTruthy: any, resultIfFalsy: any) => chekeable ? resultIfTruthy : resultIfFalsy;'
      )
      .onTop();
    tale
      .addLine('/** Ternary function for skip the complexity of Sonar */')
      .onTop();
  }

  if (tale.config.assignmentMode === 'orFn') {
    tale
      .addLine('const or = (first: any, second: any) => first || second;')
      .onTop();
    tale.addLine('/** Or function for skip the complexity of Sonar */').onTop();
  }

  return tale.getText();
}

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <article style="display: flex">
  <section style="padding-right: 1em">

  <h1>Conversor de objeto a clase</h1>
   
  <h4>Configuraciones:</h4>
  <div>
    Nombre de la clase principal <br />
    <input type="text" [(ngModel)]="defaultValueTitle"(ngModelChange)="init()" />
  </div>
  <br />

  <div>
    Valor por defecto para números <br />
    <input type="text" [(ngModel)]="defaultValueNumber" (ngModelChange)="init()"/>
  </div>
  <br />
  
  <div>
    Valor por defecto para strings <br />
    <input type="text" [(ngModel)]="defaultValueString" (ngModelChange)="init()"/>
  </div>
  <br />
  
  <div>
    Valor por defecto para boleanos <br />
    <select [(ngModel)]="defaultValueBoleans" (ngModelChange)="init()">
      <option value="null">null</option>
      <option value="true">true</option>
      <option value="false">false</option>
      <option value="undefined">undefined</option>
      </select>
      </div>
      <br />
  
  <div>
    Valor por defecto para tipo de asignación <br />
    <select [(ngModel)]="defaultValueAssignment" (ngModelChange)="init()">
      <option value="raw">||</option>
      <option value="orFn">Función Or</option>
      <option value="ternary">If ternario</option>
      <option value="ternaryFn">Función ternaria</option>
    </select>
  </div>
  </section>

  <section style="
  padding-left: 1em;
  border-left: 1px solid black;
">

  <h4>
    Objeto a convertir en clase: 
    <button (click)="init()">Iniciar conversión</button>
    &nbsp;
    <a href="https://jsonformatter.curiousconcept.com/#" target="blank">Formatealo aquí</a>
    &nbsp;
    <button (click)="clean()">Limpiar</button>
  </h4>
  <div>
    <textarea (input)="init()" id="rawBox" cols="100" rows="15" placeholder="Pega tu objeto formateado aqui..."></textarea>
  </div>
  
  <h4>Resultado:   <button (click)="copyToClipboard()">Copiar al portapapeles</button>
  </h4>
  <div>
  <textarea id="mapedBox" cols="100" rows="15" [value]="result"></textarea>
  </div>
  </section>
  
  </article>

  <span *ngIf="showSnarbarCopiedText" style="
    background: #4CAF50;
    color: white;
    padding: 1em;
    position: fixed;
    border-radius: 15px;
    bottom: 20px;
    left: 20px;
  ">
  Clases copiadas al portapapeles
  </span>


  `,
})
export class App {
  result = '';
  objRaw = null as any;

  showSnarbarCopiedText = false;
  defaultValueTitle = 'Hero';
  defaultValueNumber = '-1';
  defaultValueString = '';
  defaultValueBoleans = 'null';
  defaultValueAssignment: TypeInitializationModes = 'raw';

  init() {
    const { value: txt } = document.getElementById('rawBox') as any;

    const generatedClass = generateClass(JSON.parse(txt), {
      assignmentMode: this.defaultValueAssignment,
      addGetters: false,
      addSetters: false,
      defaultValueTitle: this.defaultValueTitle,
      defaultValueNumber: this.defaultValueNumber,
      defaultValueString: this.defaultValueString.toString(),
      defaultValueBoleans: this.defaultValueBoleans,
    });

    this.result = generatedClass;
  }

  clean() {
    (document.getElementById('rawBox') as any).value = '';
  }

  copyToClipboard() {
    let text = this.result;
    const windo = window as any;
    if (windo.clipboardData && windo.clipboardData.setData) {
      // IE: prevent textarea being shown while dialog is visible
      return windo.clipboardData.setData('Text', text);
    } else if (
      document.queryCommandSupported &&
      document.queryCommandSupported('copy')
    ) {
      var textarea = document.createElement('textarea');
      textarea.textContent = text;
      // Prevent scrolling to bottom of page in MS Edge
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        // Security exception may be thrown by some browsers
        document.execCommand('copy');
        console.log('Copiado al portapapeles', text);

        this.showSnarbarCopiedText = true;
        const timer = setTimeout(() => {
          this.showSnarbarCopiedText = false;
          clearTimeout(timer);
        }, 2000);
      } catch (ex) {
        console.warn('Copy to clipboard failed.', ex);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }
}

bootstrapApplication(App);
