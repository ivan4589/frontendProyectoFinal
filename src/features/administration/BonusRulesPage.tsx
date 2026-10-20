import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Card, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { getSubCategories } from '../../api/subCategories.api';
import { createBonusRule, getBonusRules, updateBonusRule } from '../../api/bonuses.api';

export function BonusRulesPage() {
  const cache=useQueryClient();
  const rules=useQuery({queryKey:['bonus-rules'],queryFn:getBonusRules});
  const categories=useQuery({queryKey:['subcategories'],queryFn:getSubCategories});
  const [subCategoryId,setSubCategoryId]=useState('');
  const [minimumQuantity,setMinimumQuantity]=useState(25);
  const [bonusQuantity,setBonusQuantity]=useState(1);
  const [error,setError]=useState('');
  const save=useMutation({
    mutationFn:()=>createBonusRule({subCategoryId,minimumQuantity,bonusQuantity,isActive:true}),
    onSuccess:()=>{setError('');void cache.invalidateQueries({queryKey:['bonus-rules']});},
    onError:(err:unknown)=>setError(err instanceof Error?err.message:'No se pudo guardar la bonificación'),
  });
  const change=useMutation({
    mutationFn:({id,patch}:{id:string;patch:{isActive?:boolean;minimumQuantity?:number;bonusQuantity?:number}})=>updateBonusRule(id,patch),
    onSuccess:()=>void cache.invalidateQueries({queryKey:['bonus-rules']}),
    onError:(err:unknown)=>setError(err instanceof Error?err.message:'No se pudo actualizar la promoción'),
  });
  const valid=Boolean(subCategoryId)&&Number.isSafeInteger(minimumQuantity)&&minimumQuantity>0&&Number.isSafeInteger(bonusQuantity)&&bonusQuantity>0;
  return <Box sx={{p:3,maxWidth:1000,mx:'auto'}}>
    <Typography variant="h5" fontWeight={800} gutterBottom>Bonificaciones por subcategoría</Typography>
    <Typography color="text.secondary" sx={{mb:3}}>Configura por cada cuántas unidades vendidas se regalan otras unidades. Solo el administrador puede modificar reglas.</Typography>
    {error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}
    {rules.isError&&<Alert severity="error">No se pudieron cargar las reglas.</Alert>}
    <Card variant="outlined" sx={{p:2,mb:3}}>
      <Stack spacing={2}>
        <Typography variant="h6">Nueva promoción</Typography>
        <TextField select label="Subcategoría" value={subCategoryId} onChange={e=>setSubCategoryId(e.target.value)} fullWidth>
          {(categories.data||[]).map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <Stack direction={{xs:'column',sm:'row'}} spacing={2}>
          <TextField label="Por cada unidades" type="number" value={minimumQuantity} onChange={e=>setMinimumQuantity(Number(e.target.value))} inputProps={{min:1,step:1}} fullWidth/>
          <TextField label="Regalar unidades" type="number" value={bonusQuantity} onChange={e=>setBonusQuantity(Number(e.target.value))} inputProps={{min:1,step:1}} fullWidth/>
        </Stack>
        <Button variant="contained" disabled={!valid||save.isPending} onClick={()=>save.mutate()}>Crear promoción</Button>
      </Stack>
    </Card>
    <Stack spacing={2}>
      {(rules.data||[]).map(rule=><Card variant="outlined" key={rule.id} sx={{p:2}}>
        <Stack direction={{xs:'column',sm:'row'}} alignItems={{xs:'stretch',sm:'center'}} spacing={2}>
          <Box flex={1}><Typography fontWeight={700}>{rule.subCategory?.name||categories.data?.find(c=>c.id===rule.subCategoryId)?.name||rule.subCategoryId}</Typography>
          <Typography variant="body2">Por cada {rule.minimumQuantity}, regalar {rule.bonusQuantity}</Typography></Box>
          <TextField size="small" label="Por cada" type="number" defaultValue={rule.minimumQuantity} key={rule.id+'minimum'} inputProps={{min:1,step:1}}
            onBlur={e=>{const v=Number(e.target.value);if(Number.isSafeInteger(v)&&v>0&&v!==rule.minimumQuantity)change.mutate({id:rule.id,patch:{minimumQuantity:v}})}} sx={{width:135}}/>
          <TextField size="small" label="Regalo" type="number" defaultValue={rule.bonusQuantity} key={rule.id+'bonus'} inputProps={{min:1,step:1}}
            onBlur={e=>{const v=Number(e.target.value);if(Number.isSafeInteger(v)&&v>0&&v!==rule.bonusQuantity)change.mutate({id:rule.id,patch:{bonusQuantity:v}})}} sx={{width:125}}/>
          <Switch checked={rule.isActive} disabled={change.isPending} onChange={(_,isActive)=>change.mutate({id:rule.id,patch:{isActive}})} inputProps={{'aria-label':'Activar promoción'}}/>
        </Stack>
      </Card>)}
    </Stack>
  </Box>;
}
