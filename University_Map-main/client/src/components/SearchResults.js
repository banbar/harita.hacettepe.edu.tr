// src/components/SearchResults.js
import React from 'react';
import { Box, List, ListItem, ListItemText, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SearchResults = ({ results, onResultClick, onClose }) => {
  return (
    <Box sx={{ width: 300, padding: 2, overflowY: 'auto', borderLeft: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
        <Typography variant="h6">Arama Sonuçları</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      {results.length === 0 ? (
        <Typography variant="body2">Sonuç bulunamadı.</Typography>
      ) : (
        <List>
          {results.map((result) => (
            <ListItem button key={result.place_id} onClick={() => onResultClick(result)}>
              <ListItemText primary={result.display_name} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default SearchResults;
