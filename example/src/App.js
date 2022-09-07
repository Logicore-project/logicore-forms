import React, { useState } from 'react'

import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  GenericForm,
  formComponents,
  FieldLabel,
  interceptors,
  fieldsLayouts,
  getByPath,
  setByPath,
  modifyHelper,
  update,
} from "logicore-forms";
//import 'logicore-forms/dist/index.css'

const fields = {
  "type": "Fields",
  "fields": [
    {
      "type": "TextField",
      "k": "name",
      "label": "Name",
      "required": true
    },
    {
      "type": "UUIDListField",
      "k": "items",
      "addWhat": "item",
      "layout": "WithDeleteButton",
      "fields": [
        {
          "type": "TextField",
          "k": "name",
          "label": "Item Name",
          "required": true
        },
        {
          "type": "NumberField",
          "k": "count",
          "label": "Count"
        }
      ]
    }
  ]
};

const App = () => {
  const [state, setState] = useState({});
  const [errors, setErrors] = useState({});
  const onReset = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errors = validateDefinition(fields, state);
    setErrors(errors, null);
    if (!definitionIsInvalid(fields, errors, state)) {
      console.log('data submitted', state);
    } else {
      setTimeout(() => {
        try {
          document
            .getElementsByClassName("invalid-feedback d-block")[0]
            .parentNode.scrollIntoViewIfNeeded();
        } catch (e) {
          console.warn(e);
        }
      }, 50);
    }
  };
  return (<div className="container">
    <h3 className="my-3">My First form</h3>
    <form onSubmit={onSubmit}>
      <FormComponent
        definition={fields}
        value={state}
        onChange={setState}
        error={errors}
        onReset={onReset}
        path={[]}
      />
      <div className="btn-group my-3">
        <button type="submit" className="btn btn-primary">Submit</button>
        <button type="button" className="btn btn-outline-secondary" onClick={_ => { setState(null); setErrors(null); }}>Reset</button>
      </div>
    </form>
  </div>);
}
export default App;
