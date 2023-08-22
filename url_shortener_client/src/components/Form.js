import React from "react";
import { nanoid } from 'nanoid';
import { getDatabase, child, ref, set, get } from "firebase/database";
import { isWebUri } from 'valid-url';
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";


class Form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            longURL: '',
            preferedAlias: '',
            generatedURL: '',
            loading: false,
            errors: [],
            errorMessage: {},
            toolTipMessage: 'Skopíruj'
        };
    }

    onSubmit = async (event) => {
        event.preventDefault(); // Zablokuje reload aplikacie

        this.setState({
            loading: true,
            generatedURL: ''
        })

        // validacia zadaneho vstupu
        var isFormValid = await this.validateInput()
        if (!isFormValid) {
            return
        }

        var generatedKey = nanoid(5); // vygeneruje 5 znakov
        var generatedURL = "kratkelinky.com/" + generatedKey;

        if (this.state.preferedAlias !== '') {
            generatedKey = this.state.preferedAlias;
            generatedURL = "kratkelinky.com/" + generatedKey;
        }

        const db = getDatabase();

        set(ref(db, '/' + generatedKey), {

            generatedKey: generatedKey,
            longURL: this.state.longURL,
            preferedAlias: this.state.preferedAlias,
            generatedURL: generatedURL

        }).then((result) => {
            console.log('Uspech')
            this.setState({
                generatedURL: generatedURL,
                loading: false
            })
        }).catch((e) => {
            console.error(e);
            //TODO: Handle error
        })
    }

    // zisti ci vstup nema error
    hasError = (key) => {
        return this.state.errors.indexOf(key) !== -1;
    }

    // priebezne uklada obsah co uzivatel pise
    handleChange = (e) => {
        const { id, value } = e.target
        this.setState(prevState => ({
            ...prevState,
            [id]: value
        }))
    }

    // funkcia validacie zadanych dat
    validateInput = async () => {
        var errors = [];
        var errorMessages = this.state.errorMessage;

        if (this.state.longURL.length === 0) {
            errors.push("longURL");
            errorMessages['longURL'] = 'Prosím, sem vložte URL adresu!';
        } else if (!isWebUri(this.state.longURL)) {
            errors.push("longURL");
            errorMessages['longURL'] = 'Prosím vložte URL adresu vo forme https://www...';
        }

        if (this.state.preferedAlias !== '') {
            if (this.state.preferedAlias.length > 7) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'Please enter an alias less than 7 characters long.';
            } else if (this.state.preferedAlias.indexOf(' ') >= 0) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'Medzery nie sú dovolené v URL adresách.';
            }

            var keyExists = await this.checkKeyExists();

            if (keyExists.exists()) {
                errors.push("suggestedAlias");
                errorMessages['suggestedAlias'] = 'The alias you have entered already exists. Please enter different one.';
            }
        }
        this.setState({
            errors: errors,
            errorMessages: errorMessages,
            loading: false
        });

        if (errors.length > 0) {
            return false;
        }

        return true;
    }

    checkKeyExists = async () => {
        const dbRef = ref(getDatabase());
        return get(child(dbRef, `/${this.state.preferedAlias}`)).catch((error) => {
            return false;
        });
    }

    copyToClipBoard = () => {
        navigator.clipboard.writeText(this.state.generatedURL);
        this.setState({
            toolTipMessage: 'Copied'
        })
    }

    render() {
        return (
            <div className="containter">
                <form autoComplete="off">
                    <h3>Skráť link</h3>

                    <div className="form-group">
                        <label>Vložte URL <font color='red'>*</font></label>
                        <input
                            id="longURL"
                            onChange={this.handleChange}
                            value={this.state.longURL}
                            type="url"
                            required
                            className={
                                this.hasError("longURL")
                                    ? "form-control is-invalid"
                                    : "form-control"
                            }
                            placeholder="https://www..."
                        />
                    </div>
                    <div
                        className={
                            this.hasError("longURL") ? "text-danger" : "visually-hidden"
                        }
                    >
                        {this.state.errorMessage.longURL}
                    </div>

                    <div className="form-group">
                        <label htmlFor="basic-url">Tvoj skrátený link</label>
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text">kratkelinky.com/</span>
                            </div>
                            <input
                                id="preferedAlias"
                                onChange={this.handleChange}
                                value={this.state.preferedAlias}
                                className={
                                    this.hasError("preferedAlia")
                                        ? "form-control is-invalid"
                                        : "form-control"
                                }
                                type="text"
                                placeholder="napr. 9fdsl"
                            />
                        </div>
                        <div
                            className={
                                this.hasError("preferedAlias") ? "text-danger" : "visually-hidden"
                            }
                        >
                            {this.state.errorMessage.suggestedAlias}
                        </div>
                    </div>

                    <button className="btn btn-primary" type="button" onClick={this.onSubmit}>
                        {
                            this.state.loading ?
                            <div>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </div> :
                            <div>
                                <span className="visually-hidden spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Skráť link</span>
                            </div>
                        }
                    </button>

                    {
                        this.state.generatedURL === '' ?
                        <div></div> :
                        <div className="generatedurl">
                            <span>Tvoja vygenerovana URL: </span>
                            <div className="input-group mb-3">
                                <input disabled type="text" value={this.state.generatedURL} className="form-control" placeholder="Nick" aria-label="Nick" aria-describedby="basic-addon2" />
                                <div className="input-group-append">
                                    <OverlayTrigger
                                        key={'top'}
                                        placement={'top'}
                                        overlay={
                                            <Tooltip id={`tooltip-${'top'}`}>
                                                {this.state.toolTipMessage}
                                            </Tooltip>
                                        }
                                    >

                                        <button onClick={() => this.copyToClipBoard()} data-toggle="tooltip" data-placement="top" title="Tooltip on top" className="btn btn-outline-secondary" type="button">Copy</button>
                                    
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                    }
                </form>
            </div>
        ) 
    }
}

export default Form;