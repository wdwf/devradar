import React,{useEffect, useState} from 'react';
import {View, Image, Text, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native'
import MapView, {Marker, Callout} from 'react-native-maps'
import { StyleSheet} from 'react-native'
import {requestPermissionsAsync, getCurrentPositionAsync} from 'expo-location'
import {MaterialIcons} from '@expo/vector-icons'
import api from '../services/api'
import { connect, disconnect, subscribeToNewDevs } from './../services/socket'

function Main({navigation}){
    const [currentRegion, setCurrentRegion ] = useState(null);
    const [devs, setDevs] = useState([]);
    const [techs, setTechs]= useState('');

    useEffect(()=>{

    //para pegar a posição do usuario
    async function loadnitialPosition(){
        const {granted} = await requestPermissionsAsync();

        if(granted){
            const {coords} = await getCurrentPositionAsync({
                enableHighAccuracy: true,
            });
            const {latitude,longitude} = coords

            setCurrentRegion({
                latitude,
                longitude,
                latitudeDelta:0.03,
                longitudeDelta:0.03,
            })
        }

    }
    loadnitialPosition()

},[])

useEffect(()=>{
    subscribeToNewDevs(dev => setDevs([...devs, dev]));
},[devs])

if(!currentRegion){
    return null;
}

 function setupWebsocket(){

    disconnect();

    const {latitude, longitude} = currentRegion

    connect(
        latitude,
        longitude,
        techs
    );

}

async function loadDevs(){
    const { latitude, longitude} = currentRegion

    const response = await api.get('/search', {
        //Não esquecer de paassar como parametros (params)
        params:{
            latitude,
            longitude,
            techs}
    });

    setDevs(response.data.devs)
    setupWebsocket();
}


 function handleRegionChanged(region){
    setCurrentRegion(region);
    console.log(region)
 }
    return(     
        <KeyboardAvoidingView behavior="padding" style={{flex:1}}> 
        <>
        
        <MapView onRegionChangeComplete={handleRegionChanged} initialRegion={currentRegion} style={styles.map}>       
            {devs.map(dev=>{
                return  <Marker key={dev._id} coordinate={{
                    latitude: dev.location.coordinates[1], 
                    longitude: dev.location.coordinates[0]}}>

                <Image style={styles.avatar} source={{uri: dev.avatar_url}}></Image>
                
                <Callout onPress={()=>{
                    navigation.navigate('Profile',{ github_username: dev.github_username })
                }}>
                    <View style={styles.callout}>
                        <Text style={styles.devName}>{dev.name}</Text>
                        <Text style={styles.devBio}>{dev.bio}</Text>
                        <Text style={styles.devTechs}>{dev.techs.join(', ')}</Text>
                    </View>
                </Callout>
                
                </Marker>
            })}
            </MapView>

            
                <View style={styles.searchForm}>
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Buscar devs por thecs..."
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                    vaue={techs}
                    onChangeText={techs => setTechs(techs)}/>
                    
                    <TouchableOpacity onPress={loadDevs} style={styles.loadButton}>
                            <MaterialIcons name="my-location" 
                                        size={20} 
                                        color="#fff"></MaterialIcons>
                        
                        </TouchableOpacity>
                </View>
            
        </></KeyboardAvoidingView>
        );
}

const styles = StyleSheet.create({
map:{
    flex:1,
},
avatar:{
    height:54,
    width:54,
    borderRadius:4,
    borderWidth:4,
    borderColor:'#fff',
},
callout:{
    width:260,
},
devName:{
    fontWeight:'bold',
    fontSize:16,
},
devBio:{
    color:'#666',
    marginTop:5,
},
devTechs:{
    marginTop:5
},
searchForm:{
    position:'absolute',
    left:20,
    top:20,
    right:20,
    zIndex:5,
    flexDirection:'row',
},
searchInput:{
    flex:1,
    height:50,
    backgroundColor:'#fff',
    color:"#333",
    borderRadius:25,
    paddingHorizontal: 20,
    fontSize:16,
    shadowColor:'#000',
    shadowOpacity:0.2,
    shadowOffset:{
        width:4,
        height:4,
    },
    elevation:2,
},
loadButton:{
    width:50,
    height:50,
    backgroundColor: '#8e4dff',
    borderRadius:25,
    justifyContent:'center',
    alignItems:'center',
    marginLeft:15,
}

});

export default Main