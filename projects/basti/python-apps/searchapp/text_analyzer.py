# text_analyzer.py
import re
from typing import Dict, List, Optional

class TextAnalyzer:
    """
    A class for analyzing text content with various metrics and statistics.
    
    Attributes:
        text (str): The text to be analyzed
    """
    
    def __init__(self, text: str):
        """
        Initialize the TextAnalyzer with the text to analyze.
        
        Args:
            text (str): The text to be analyzed
        """
        self.text = text

    def count_characters(self, only_letters: bool = False) -> int:
        """
        Count the number of characters in the text.
        
        Args:
            only_letters (bool): If True, only count alphabetic characters
            
        Returns:
            int: The number of characters
        """
        if only_letters:
            return sum(c.isalpha() for c in self.text)
        return len(self.text)

    def count_words(self) -> int:
        """
        Count the number of words in the text.
        Words are defined as sequences of alphanumeric characters.
        
        Returns:
            int: The number of words
        """
        return len(re.findall(r'\b\w+\b', self.text))

    def count_numbers(self) -> int:
        """
        Count the number of numeric sequences in the text.
        
        Returns:
            int: The number of numeric sequences
        """
        return len(re.findall(r'\b\d+\b', self.text))

    def count_specific_character(self, char: str) -> int:
        """
        Count occurrences of a specific character in the text.
        
        Args:
            char (str): The character to count
            
        Returns:
            int: The number of occurrences
        """
        return self.text.count(char)

    def get_word_frequency(self) -> Dict[str, int]:
        """
        Calculate the frequency of each word in the text.
        
        Returns:
            Dict[str, int]: Dictionary mapping words to their frequencies
        """
        words = re.findall(r'\b\w+\b', self.text.lower())
        frequency = {}
        for word in words:
            frequency[word] = frequency.get(word, 0) + 1
        return frequency

    def get_most_common_words(self, n: int = 5) -> List[tuple]:
        """
        Get the n most common words in the text.
        
        Args:
            n (int): Number of most common words to return
            
        Returns:
            List[tuple]: List of (word, frequency) tuples
        """
        frequency = self.get_word_frequency()
        return sorted(frequency.items(), key=lambda x: x[1], reverse=True)[:n]

    def get_average_word_length(self) -> float:
        """
        Calculate the average length of words in the text.
        
        Returns:
            float: Average word length
        """
        words = re.findall(r'\b\w+\b', self.text)
        if not words:
            return 0.0
        return sum(len(word) for word in words) / len(words)

    def get_text_statistics(self) -> Dict[str, float]:
        """
        Get comprehensive statistics about the text.
        
        Returns:
            Dict[str, float]: Dictionary containing various text statistics
        """
        return {
            'total_characters': self.count_characters(),
            'total_letters': self.count_characters(only_letters=True),
            'total_words': self.count_words(),
            'total_numbers': self.count_numbers(),
            'average_word_length': self.get_average_word_length(),
            'word_density': self.count_words() / max(1, self.count_characters())
        }
