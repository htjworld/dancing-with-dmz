"""Critical numerical and missing-data behavior, runnable without credentials."""
import unittest
import numpy as np
from collect import multilook_valid, NODATA
from render import smooth_linear, rgba


class ProcessingTests(unittest.TestCase):
    def test_multilook_uses_only_valid_positive_focused_power(self):
        hh=np.array([[1,100,np.nan],[0,-1,9],[8,7,6]],dtype='float32')
        mask=np.array([[1,1,1],[1,1,0],[255,0,0]],dtype='uint8')
        values,count=multilook_valid(hh,mask)
        self.assertEqual(count[0,0],2)
        self.assertEqual(values[0,0],50.5)

    def test_missing_cells_remain_missing(self):
        values,count=multilook_valid(np.ones((3,6),dtype='float32'),np.zeros((3,6),dtype='uint8'))
        self.assertTrue(np.all(count==0))
        self.assertTrue(np.all(values==NODATA))
        self.assertTrue(np.all(smooth_linear(values)==NODATA))

    def test_smoothing_keeps_the_invalid_centre_missing(self):
        values=np.ones((7,7),dtype='float32')*4
        values[3,3]=NODATA
        smoothed=smooth_linear(values)
        self.assertEqual(smoothed[3,3],NODATA)
        np.testing.assert_allclose(smoothed[values>0],4)

    def test_display_value_and_missing_alpha_are_separate(self):
        image=rgba(np.array([[0,.75,1.5,10]],dtype='float32'),np.array([[True,True,True,False]]),value=True)
        np.testing.assert_array_equal(image[0,:,0],[0,128,255,255])
        np.testing.assert_array_equal(image[0,:,3],[255,255,255,0])


if __name__=='__main__': unittest.main()
