class TextElement extends fabric.IText {
    constructor(text = 'NewText', style = false) {
        if (!style) {
            style = {
                fontSize: 20,
                fill: '#000000',
                editable: true,
                underline: false,
                fontFamily: 'Lato',
                fontWeight: 'normal',
                fontStyle: 'normal',
            };
        }
        super(text, style);
        this.type = 'TextElement';
    }

    setTextStyle(style) {
        switch (style) {
            case 'normal':
                this.fill = '#000'
                this.backgroundColor = '#FFF'
                this.fontWeight = 'normal'
                this.fontStyle = 'normal'
                this.textDecoration = 'normal'
                break;
            case 'bold':
                this.fontWeight = this.fontWeight == 'bold' ? 'normal' : 'bold'
                break;
            case 'italic':
                this.fontStyle = this.fontStyle == 'italic' ? 'normal' : 'italic'
                break;
            case 'underline':
                // this.underline = !this.underline
                this.textDecoration = 'underline' // This is fabric 1.5
                break;
            case 'red':
                this.fill = '#F00'
                this.backgroundColor = '#FFF'
                break;
            case 'green':
                this.fill = '#008000'
                this.backgroundColor = '#FFF'
                break;
            case 'lgray':
                this.fill = '#d3d3d3'
                this.backgroundColor = '#FFF'
                break;
            case 'bgcyan':
                this.backgroundColor = '#0FF'
                this.fill = '#000'
                break;
            case 'bgyellow':
                this.backgroundColor = '#FF0'
                this.fill = '#000'
                break;
            default:
                break;
        }
    }

    setPosition(top = 0, left = 0) {
        this.top = top;
        this.left = left;
    }
}