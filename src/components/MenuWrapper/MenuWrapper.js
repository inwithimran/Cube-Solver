import React,{Component} from "react";
import MobileView from "../MobileView/MobileView";
import View from "../View";
import SideView from "../SideView/SideView";
class Menu extends Component {
    // eslint-disable-next-line no-useless-constructor
    constructor(props) {
        super(props);
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        //if(this.props.state.currentFunc===nextProps.state.activeMenu) return false;
        return true;
    }
    render(){
        const props = this.props;
        return (window.innerWidth > 760&&window.innerHeight>580)? 
            <SideView {...props}/> 
                : window.innerWidth > 600?
            <View {...props}/>:
            <MobileView {...props}/>;  
    } 
}

export default React.memo(Menu);